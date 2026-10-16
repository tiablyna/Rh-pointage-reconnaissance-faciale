const Employe = require("../models/Employe");
const Poste = require("../models/Poste");
const Structure = require("../models/Structure");
const Horaire = require("../models/Horaire");
const Absence = require("../models/Absence"); // Ajouter cette ligne
const Conge = require("../models/Conge"); // Ajouter cette ligne
const HeureSup = require("../models/HeureSupplementaire");
const EvenementCarriere = require("../models/EvenementCarriere");
const bcrypt = require("bcryptjs");
const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");
const AdmZip = require("adm-zip");

// ─── HELPER : trouver les IDs d'employés par département ─────────────────────
const getEmployeIdsByDepartement = async (departementId) => {
  const postes = await Poste.find({ structure: departementId }).select("_id");
  const posteIds = postes.map((p) => p._id);
  const employes = await Employe.find({
    poste_actuel: { $in: posteIds },
  }).select("_id");
  return employes.map((e) => e._id);
};

// ─── HELPER : parser une date quelle que soit sa forme ───────────────────────
// Accepte : "25/03/1990", "1990-03-25", "DD-MM-YYYY", objet Date JS, timestamp Excel (nombre)
const parseDate = (val) => {
  if (!val) return null;
  // Déjà un objet Date valide
  if (val instanceof Date && !isNaN(val)) return val;
  // Nombre → timestamp Excel (jours depuis 1900-01-01)
  if (typeof val === "number") {
    // Excel serial date : 1 = 1900-01-01
    const excelEpoch = new Date(1900, 0, 1);
    const d = new Date(excelEpoch.getTime() + (val - 2) * 86400000);
    return isNaN(d) ? null : d;
  }
  const s = String(val).trim();
  if (!s) return null;
  // Format JJ/MM/AAAA ou DD-MM-YYYY
  const dmySlash = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmySlash) {
    const d = new Date(
      `${dmySlash[3]}-${dmySlash[2].padStart(2, "0")}-${dmySlash[1].padStart(2, "0")}`,
    );
    return isNaN(d) ? null : d;
  }
  // Format ISO AAAA-MM-JJ
  const iso = new Date(s);
  return isNaN(iso) ? null : iso;
};

// ─── GET ALL EMPLOYÉS ─────────────────────────────────────────────────────────
const getAllEmployes = async (req, res) => {
  try {
    const { departement, recherche } = req.query;
    let filtre = {};

    if (departement) {
      const postes = await Poste.find({ structure: departement }).select("_id");
      filtre.poste_actuel = { $in: postes.map((p) => p._id) };
    }

    if (recherche) {
      filtre.$or = [
        { nom: { $regex: recherche, $options: "i" } },
        { prenom: { $regex: recherche, $options: "i" } },
        { matricule: { $regex: recherche, $options: "i" } },
      ];
    }

    const employes = await Employe.find(filtre)
      .populate({
        path: "poste_actuel",
        select: "intitule niveau",
        populate: { path: "structure", select: "nom_departement STRacro" },
      })
      .populate("horaire", "nom_horaire type heure_debut heure_fin")
      .select("-mot_de_passe")
      .sort({ nom: 1 });

    res.json(employes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── GET EMPLOYÉ BY ID ────────────────────────────────────────────────────────
const getEmployeById = async (req, res) => {
  try {
    const employe = await Employe.findById(req.params.id)
      .populate({
        path: "poste_actuel",
        select: "intitule niveau description",
        populate: {
          path: "structure",
          select: "nom_departement STRacro description",
        },
      })
      .populate("horaire")
      .select("-mot_de_passe");
    if (!employe)
      return res.status(404).json({ message: "Employé non trouvé" });
    res.json(employe);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── GET CARRIÈRE EMPLOYÉ ─────────────────────────────────────────────────────
const getCarriereEmploye = async (req, res) => {
  try {
    const evenements = await EvenementCarriere.find({ employe: req.params.id })
      .populate({
        path: "poste_avant",
        select: "intitule niveau",
        populate: { path: "structure", select: "nom_departement STRacro" },
      })
      .populate({
        path: "poste_apres",
        select: "intitule niveau",
        populate: { path: "structure", select: "nom_departement STRacro" },
      })
      .populate("structure_avant", "nom_departement STRacro")
      .populate("structure_apres", "nom_departement STRacro")
      .sort({ date_evenement: -1 });
    res.json(evenements);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── GET PLANNING MENSUEL ─────────────────────────────────────────────────────
const getPlanningEmploye = async (req, res) => {
  try {
    const { id } = req.params;
    const { mois, annee, format } = req.query;

    const moisInt = parseInt(mois) || new Date().getMonth() + 1;
    const anneeInt = parseInt(annee) || new Date().getFullYear();

    const debutMois = new Date(anneeInt, moisInt - 1, 1);
    const finMois = new Date(anneeInt, moisInt, 0, 23, 59, 59);

    const EmployeAbsence = require("../models/EmployeAbsence");
    const EmployeConge = require("../models/EmployeConge");
    const EmployeHeureSup = require("../models/EmployeHeureSup");

    const [absencesLiens, congesLiens, hsLiens, employe] = await Promise.all([
      EmployeAbsence.find({ employe: id }).populate("absence"),
      EmployeConge.find({ employe: id }).populate("conge"),
      EmployeHeureSup.find({ employe: id }).populate("heure_sup"),
      Employe.findById(id)
        .populate({
          path: "poste_actuel",
          select: "intitule niveau",
          populate: { path: "structure", select: "nom_departement STRacro" },
        })
        .populate("horaire"),
    ]);

    const absences = absencesLiens
      .filter((l) => l.absence && l.absence.statut_validation === "Validée")
      .filter((l) => {
        const d = new Date(l.absence.date_debut);
        const f = new Date(l.absence.date_fin);
        return d <= finMois && f >= debutMois;
      })
      .map((l) => ({ ...l.absence.toObject(), _type: "absence" }));

    const conges = congesLiens
      .filter((l) => l.conge && l.conge.statut === "Validée")
      .filter((l) => {
        const d = new Date(l.conge.date_debut);
        const f = new Date(l.conge.date_fin);
        return d <= finMois && f >= debutMois;
      })
      .map((l) => ({ ...l.conge.toObject(), _type: "conge" }));

    const heuresSup = hsLiens
      .filter((l) => {
        if (!l.heure_sup) return false;
        const d = new Date(l.heure_sup.date);
        return d >= debutMois && d <= finMois;
      })
      .map((l) => ({ ...l.heure_sup.toObject(), _type: "heure_sup" }));

    if (format === "liste") {
      return res.json({ absences, conges, heuresSup });
    }

    const jours = [];
    const nbJours = finMois.getDate();

    for (let i = 1; i <= nbJours; i++) {
      const date = new Date(anneeInt, moisInt - 1, i);
      const jourSemaine = date.getDay();
      let statut = "present";
      let details = null;

      if (jourSemaine === 5 || jourSemaine === 6) statut = "weekend";

      const conge = conges.find((c) => {
        const debut = new Date(c.date_debut);
        const fin = new Date(c.date_fin);
        return date >= debut && date <= fin;
      });
      if (conge) {
        statut = "conge";
        details = { type: "Congé", commentaire: conge.commentaire_emp };
      }

      const absence = absences.find((a) => {
        const debut = new Date(a.date_debut);
        const fin = new Date(a.date_fin);
        return date >= debut && date <= fin;
      });
      if (absence) {
        statut = "absence";
        details = { type: absence.motif_absence, justifiee: absence.justifiee };
      }

      const hsJour = heuresSup.filter(
        (h) => new Date(h.date).toDateString() === date.toDateString(),
      );

      jours.push({
        date: date.toISOString().split("T")[0],
        jour: i,
        jourSemaine,
        statut,
        details,
        heuresSup: hsJour.length > 0 ? hsJour : undefined,
      });
    }

    const poste = employe?.poste_actuel || null;
    const departement = poste?.structure || null;

    res.json({
      mois: moisInt,
      annee: anneeInt,
      jours,
      horaire: employe?.horaire || null,
      poste,
      departement,
      resume: {
        absences: absences.length,
        conges: conges.length,
        heuresSup: heuresSup.length,
      },
    });
  } catch (err) {
    console.error("Erreur getPlanningEmploye:", err);
    res.status(500).json({ message: err.message });
  }
};

// ─── CRÉER EMPLOYÉ ────────────────────────────────────────────────────────────
// Dans creerEmploye
const creerEmploye = async (req, res) => {
  try {
    const {
      matricule,
      nom,
      prenom,
      email,
      mot_de_passe,
      telephone,
      date_naissance,
      lieu_naissance,
      date_embauche,
      date_fin_contrat,
      role,
      poste_actuel,
      horaire,
    } = req.body;

    // Vérifier si l'email existe déjà
    const emailExistant = await Employe.findOne({ email });
    if (emailExistant) {
      return res.status(400).json({ message: "Cet email est déjà utilisé" });
    }

    // Vérifier si le matricule existe déjà
    const matriculeExistant = await Employe.findOne({ matricule });
    if (matriculeExistant) {
      return res.status(400).json({ message: "Ce matricule est déjà utilisé" });
    }

    // Récupérer les photos
    let photos = [];
    if (req.files && req.files.length > 0) {
      photos = req.files.map((f) => f.filename);
    }

    // VALIDATION CRITIQUE : Au moins 3 photos
    if (photos.length < 3) {
      // Supprimer les photos déjà uploadées
      photos.forEach((photo) => {
        const chemin = path.join(__dirname, "../uploads", photo);
        if (fs.existsSync(chemin)) fs.unlinkSync(chemin);
      });
      return res
        .status(400)
        .json({ message: "Au moins 3 photos sont requises" });
    }

    // Hasher le mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(mot_de_passe, salt);

    // Créer l'employé
    const employe = new Employe({
      matricule,
      nom,
      prenom,
      email,
      mot_de_passe: hashedPassword,
      telephone,
      date_naissance,
      lieu_naissance,
      date_embauche,
      date_fin_contrat,
      role,
      poste_actuel,
      horaire,
      photo: photos,
    });

    await employe.save();

    res.status(201).json({ message: "Employé créé avec succès", employe });
  } catch (error) {
    // Nettoyer les photos en cas d'erreur
    if (req.files) {
      req.files.forEach((file) => {
        const chemin = path.join(__dirname, "../uploads", file.filename);
        if (fs.existsSync(chemin)) fs.unlinkSync(chemin);
      });
    }
    res.status(500).json({ message: error.message });
  }
};

// ─── MODIFIER INFOS EMPLOYÉ ───────────────────────────────────────────────────
const modifierEmploye = async (req, res) => {
  try {
    const { id } = req.params;
    const employe = await Employe.findById(id);

    if (!employe) {
      return res.status(404).json({ message: "Employé non trouvé" });
    }

    // Vérifier si le matricule est modifié et n'existe pas déjà
    if (req.body.matricule && req.body.matricule !== employe.matricule) {
      const matriculeExistant = await Employe.findOne({
        matricule: req.body.matricule,
        _id: { $ne: id }, // Exclure l'employé actuel
      });
      if (matriculeExistant) {
        return res.status(400).json({
          message: "Le matricule existe déjà",
          field: "matricule",
          value: req.body.matricule,
        });
      }
    }

    // Vérifier si l'email est modifié et n'existe pas déjà
    if (req.body.email && req.body.email !== employe.email) {
      const emailExistant = await Employe.findOne({
        email: req.body.email,
        _id: { $ne: id },
      });
      if (emailExistant) {
        return res.status(400).json({
          message: " L'adresse email existe déjà",
          field: "email",
          value: req.body.email,
        });
      }
    }

    // Gérer les photos (code existant)
    let photosFinales = [];

    if (req.body.photo_json) {
      photosFinales = JSON.parse(req.body.photo_json);
    } else {
      photosFinales = employe.photo;
    }

    let nouvellesPhotos = [];
    if (req.files && req.files.length > 0) {
      nouvellesPhotos = req.files.map((f) => f.filename);
      photosFinales = [...photosFinales, ...nouvellesPhotos];
    }

    // Validation des photos
    if (photosFinales.length < 3) {
      nouvellesPhotos.forEach((photo) => {
        const chemin = path.join(__dirname, "../uploads", photo);
        if (fs.existsSync(chemin)) fs.unlinkSync(chemin);
      });
      return res.status(400).json({
        message: " Au moins 3 photos sont requises",
        field: "photos",
      });
    }

    // Supprimer les anciennes photos
    const photosASupprimer = employe.photo.filter(
      (p) => !photosFinales.includes(p),
    );
    photosASupprimer.forEach((photo) => {
      const chemin = path.join(__dirname, "../uploads", photo);
      if (fs.existsSync(chemin)) fs.unlinkSync(chemin);
    });

    // Mettre à jour les champs
    const champsModifiables = [
      "matricule",
      "nom",
      "prenom",
      "email",
      "telephone",
      "date_naissance",
      "lieu_naissance",
      "date_embauche",
      "date_fin_contrat",
      "role",
      "poste_actuel",
      "horaire",
    ];

    champsModifiables.forEach((champ) => {
      if (req.body[champ] !== undefined) {
        employe[champ] = req.body[champ];
      }
    });

    if (req.body.nouveau_mot_de_passe) {
      const salt = await bcrypt.genSalt(10);
      employe.mot_de_passe = await bcrypt.hash(
        req.body.nouveau_mot_de_passe,
        salt,
      );
    }

    employe.photo = photosFinales;
    await employe.save();

    res.json({
      message: " Employé modifié avec succès",
      employe,
    });
  } catch (error) {
    console.error(error);

    // Gérer l'erreur de duplication MongoDB
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      const value = error.keyValue[field];

      let message = "";
      if (field === "matricule") {
        message = `Le matricule "${value}" est déjà utilisé par un autre employé`;
      } else if (field === "email") {
        message = `L'adresse email "${value}" est déjà utilisée par un autre employé`;
      } else {
        message = `La valeur "${value}" pour le champ ${field} existe déjà`;
      }

      return res.status(400).json({ message, field, value });
    }

    res
      .status(500)
      .json({
        message: " Erreur lors de la modification",
        error: error.message,
      });
  }
};

// ─── SUPPRIMER EMPLOYÉ ────────────────────────────────────────────────────────
// Stratégie : importer les valides, afficher un rapport des erreurs

const supprimerEmploye = async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier si l'employé existe
    const employe = await Employe.findById(id);

    if (!employe) {
      return res.status(404).json({ message: "Employé non trouvé" });
    }

    // Compter les dépendances
    const [absences, conges, heuresSup, evenementsCarriere] = await Promise.all(
      [
        Absence.countDocuments({ employe: id }),
        Conge.countDocuments({ employe: id }),
        HeureSup.countDocuments({ employe: id }),
        EvenementCarriere
          ? EvenementCarriere.countDocuments({ employe: id })
          : 0,
      ],
    );

    // Supprimer en cascade (tout supprimer)
    await Promise.all([
      Absence.deleteMany({ employe: id }),
      Conge.deleteMany({ employe: id }),
      HeureSup.deleteMany({ employe: id }),
      EvenementCarriere
        ? EvenementCarriere.deleteMany({ employe: id })
        : Promise.resolve(),
    ]);

    // Supprimer les photos
    if (employe.photo && employe.photo.length > 0) {
      const fs = require("fs");
      const path = require("path");
      employe.photo.forEach((photo) => {
        const chemin = path.join(__dirname, "../uploads", photo);
        if (fs.existsSync(chemin)) fs.unlinkSync(chemin);
      });
    }

    // Supprimer l'employé
    await employe.deleteOne();

    res.json({
      message: "Employé supprimé avec succès",
      suppressions: {
        absences,
        conges,
        heuresSup,
        evenementsCarriere,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la suppression:", error);
    res.status(500).json({
      message: "Erreur lors de la suppression",
      error: error.message,
      details: error.stack,
    });
  }
};

// ─── GÉRER CARRIÈRE ───────────────────────────────────────────────────────────
const gererCarriere = async (req, res) => {
  try {
    const { id } = req.params;
    const { type_evenement, nouveau_poste, date_evenement, commentaire } =
      req.body;

    const employe = await Employe.findById(id);
    if (!employe)
      return res.status(404).json({ message: "Employé non trouvé" });

    const poste_avant = employe.poste_actuel;
    const ancienPoste = await Poste.findById(poste_avant);
    const structure_avant = ancienPoste?.structure;

    const posteApres = nouveau_poste
      ? await Poste.findById(nouveau_poste)
      : ancienPoste;
    if (nouveau_poste && !posteApres)
      return res.status(404).json({ message: "Nouveau poste non trouvé" });

    const structure_apres = posteApres?.structure;

    await EvenementCarriere.create({
      employe: id,
      type_evenement,
      date_evenement: parseDate(date_evenement) || new Date(),
      poste_avant,
      structure_avant,
      poste_apres: posteApres?._id || poste_avant,
      structure_apres,
      commentaire,
    });

    if (nouveau_poste) employe.poste_actuel = nouveau_poste;
    await employe.save();

    const employeMaj = await Employe.findById(id)
      .populate({
        path: "poste_actuel",
        select: "intitule niveau",
        populate: { path: "structure", select: "nom_departement STRacro" },
      })
      .select("-mot_de_passe");

    res.json({
      message: "Carrière mise à jour avec succès",
      employe: employeMaj,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── IMPORT EN MASSE (Excel + ZIP) ───────────────────────────────────────────
// Colonnes Excel attendues :
//   matricule, nom, prenom, email, mot_de_passe, telephone,
//   date_naissance, lieu_naissance, date_embauche, date_fin_contrat,
//   role, poste_actuel (ID MongoDB), horaire (ID MongoDB, optionnel),
//   nom_fichier_photo  (ex: dupont.jean1.jpg ou vide)
//
// Le ZIP contient toutes les photos nommées exactement comme dans l'Excel.
// Un employé peut avoir plusieurs photos : dupont.jean1.jpg, dupont.jean2.jpg ...
// → dans l'Excel on peut mettre "dupont.jean1.jpg;dupont.jean2.jpg" (séparé par ;)
//   OU avoir plusieurs lignes avec le même matricule et des photos différentes
//
// Stratégie erreurs : importer les valides, rapport des erreurs
const importerEmployes = async (req, res) => {
  try {
    if (!req.files || !req.files.excel || !req.files.zip) {
      return res.status(400).json({ message: "Fichier Excel et ZIP requis" });
    }

    const excelFile = req.files.excel[0];
    const zipFile = req.files.zip[0];
    
    // Lire le fichier Excel
    const workbook = XLSX.readFile(excelFile.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const lignes = XLSX.utils.sheet_to_json(sheet);
    
    // Lire le ZIP et indexer TOUTES les photos par leur nom de fichier
    const zip = new AdmZip(zipFile.path);
    const photosIndex = new Map();
    
    zip.getEntries().forEach(entry => {
      if (!entry.isDirectory) {
        const nomComplet = entry.entryName.split('/').pop();
        photosIndex.set(nomComplet, entry.getData());
        console.log(`📷 Photo indexée: ${nomComplet}`);
      }
    });
    
    console.log(`📦 Total photos dans le ZIP: ${photosIndex.size}`);
    
    // Récupérer tous les départements, postes et horaires pour mapping
    const departements = await Structure.find();
    const postes = await Poste.find();
    const horaires = await Horaire.find();
    
    // Mapping par NOM (insensible à la casse)
    const mapDeptNomToId = {};
    departements.forEach(d => {
      mapDeptNomToId[d.nom_departement.toLowerCase()] = d._id;
    });
    
    const mapPosteNomToId = {};
    postes.forEach(p => {
      mapPosteNomToId[p.intitule.toLowerCase()] = p._id;
    });
    
    // Mapping des horaires par nom ou type
    const mapHoraireNomToId = {};
    horaires.forEach(h => {
      if (h.nom_horaire) {
        mapHoraireNomToId[h.nom_horaire.toLowerCase()] = h._id;
      }
      if (h.type) {
        mapHoraireNomToId[h.type.toLowerCase()] = h._id;
      }
    });
    
    console.log("📋 Horaires disponibles:", Object.keys(mapHoraireNomToId));
    
    const resultats = {
      crees: [],
      ignores: [],
      erreurs: [],
      resume: { total: 0, crees: 0, ignores: 0, erreurs: 0, avertissements: 0 }
    };
    
    // Fonction de formatage des dates
    const formaterDate = (dateStr) => {
      if (!dateStr) return null;
      
      // Si c'est déjà un objet Date valide
      if (dateStr instanceof Date && !isNaN(dateStr)) {
        return dateStr;
      }
      
      // Si c'est un nombre (timestamp Excel)
      if (typeof dateStr === 'number') {
        const excelEpoch = new Date(1900, 0, 1);
        const d = new Date(excelEpoch.getTime() + (dateStr - 2) * 86400000);
        return isNaN(d) ? null : d;
      }
      
      // Convertir en string
      const s = String(dateStr).trim();
      if (!s) return null;
      
      // Format DD-MM-YYYY ou DD/MM/YYYY
      if (s.match(/^\d{2}[-\/]\d{2}[-\/]\d{4}$/)) {
        const [jour, mois, annee] = s.split(/[-\/]/);
        const d = new Date(`${annee}-${mois}-${jour}`);
        return isNaN(d) ? null : d;
      }
      
      // Format YYYY-MM-DD
      if (s.match(/^\d{4}-\d{2}-\d{2}/)) {
        const d = new Date(s);
        return isNaN(d) ? null : d;
      }
      
      // Dernier essai
      const d = new Date(s);
      return isNaN(d) ? null : d;
    };
    
    for (let idx = 0; idx < lignes.length; idx++) {
      const ligne = lignes[idx];
      const numLigne = idx + 2;
      
      try {
        // Validation des champs obligatoires
        if (!ligne.matricule || !ligne.nom || !ligne.prenom || !ligne.email || !ligne.mot_de_passe || !ligne.poste_actuel) {
          resultats.erreurs.push({
            ligne: numLigne,
            matricule: ligne.matricule || "?",
            erreur: "Champs obligatoires manquants (matricule, nom, prenom, email, mot_de_passe, poste_actuel)"
          });
          resultats.resume.erreurs++;
          continue;
        }
        
        const matriculeStr = String(ligne.matricule);
        
        // Vérifier si l'email existe déjà
        const emailExistant = await Employe.findOne({ email: ligne.email });
        if (emailExistant) {
          resultats.ignores.push({
            ligne: numLigne,
            matricule: matriculeStr,
            raison: "Email déjà utilisé"
          });
          resultats.resume.ignores++;
          continue;
        }
        
        // Vérifier si le matricule existe déjà
        const matriculeExistant = await Employe.findOne({ matricule: matriculeStr });
        if (matriculeExistant) {
          resultats.ignores.push({
            ligne: numLigne,
            matricule: matriculeStr,
            raison: "Matricule déjà existant"
          });
          resultats.resume.ignores++;
          continue;
        }
        
        // Trouver le département par son NOM
        let departementId = null;
        if (ligne.departement) {
          const deptId = mapDeptNomToId[String(ligne.departement).toLowerCase()];
          if (deptId) {
            departementId = deptId;
          } else {
            resultats.erreurs.push({
              ligne: numLigne,
              matricule: matriculeStr,
              erreur: `Département "${ligne.departement}" n'existe pas`
            });
            resultats.resume.erreurs++;
            continue;
          }
        }
        
        // Trouver le poste par son NOM
        let posteId = null;
        if (ligne.poste_actuel) {
          const posteIdTrouve = mapPosteNomToId[String(ligne.poste_actuel).toLowerCase()];
          if (posteIdTrouve) {
            // Vérifier que le poste appartient au bon département
            const poste = postes.find(p => p._id.toString() === posteIdTrouve.toString());
            if (departementId && poste && poste.structure.toString() !== departementId.toString()) {
              resultats.erreurs.push({
                ligne: numLigne,
                matricule: matriculeStr,
                erreur: `Le poste "${ligne.poste_actuel}" n'appartient pas au département "${ligne.departement}"`
              });
              resultats.resume.erreurs++;
              continue;
            }
            posteId = posteIdTrouve;
          } else {
            resultats.erreurs.push({
              ligne: numLigne,
              matricule: matriculeStr,
              erreur: `Poste "${ligne.poste_actuel}" n'existe pas`
            });
            resultats.resume.erreurs++;
            continue;
          }
        }
        
        // Trouver l'horaire par son NOM (ou par ID si c'est déjà un ID)
        let horaireId = null;
        if (ligne.horaire) {
          const horaireValeur = String(ligne.horaire).trim();
          const isValidObjectId = require('mongoose').Types.ObjectId.isValid;
          
          if (isValidObjectId(horaireValeur)) {
            // C'est déjà un ID MongoDB valide
            horaireId = horaireValeur;
          } else {
            // Chercher par nom (insensible à la casse)
            horaireId = mapHoraireNomToId[horaireValeur.toLowerCase()] || null;
            if (!horaireId) {
              console.log(`⚠️ Horaire non trouvé pour "${horaireValeur}", sera ignoré`);
              // Ce n'est pas une erreur bloquante, on continue sans horaire
            }
          }
        }
        
        // Récupérer les photos par les noms spécifiés dans l'Excel
        let photosTrouvees = [];
        
        if (ligne.nom_fichier_photo) {
          const nomsPhotos = String(ligne.nom_fichier_photo).split(';').map(n => n.trim());
          
          console.log(`🔍 Recherche photos pour ${matriculeStr}:`, nomsPhotos);
          
          for (const nomPhoto of nomsPhotos) {
            if (photosIndex.has(nomPhoto)) {
              const buffer = photosIndex.get(nomPhoto);
              const extension = path.extname(nomPhoto);
              const filename = `${Date.now()}-${Math.random()}-${nomPhoto}`;
              const filepath = path.join(__dirname, '../uploads', filename);
              fs.writeFileSync(filepath, buffer);
              photosTrouvees.push(filename);
              console.log(`✅ Photo trouvée: ${nomPhoto}`);
            } else {
              console.log(`❌ Photo non trouvée: ${nomPhoto}`);
            }
          }
        }
        
        // VALIDATION : Au moins 3 photos
        if (photosTrouvees.length < 3) {
          resultats.erreurs.push({
            ligne: numLigne,
            matricule: matriculeStr,
            erreur: `Au moins 3 photos requises. Trouvées: ${photosTrouvees.length}. Photos cherchées: ${ligne.nom_fichier_photo || "aucune"}`
          });
          resultats.resume.erreurs++;
          continue;
        }
        
        // Créer l'employé
        const nouvelEmploye = new Employe({
          matricule: matriculeStr,
          nom: ligne.nom,
          prenom: ligne.prenom,
          email: ligne.email,
          mot_de_passe: ligne.mot_de_passe,
          telephone: ligne.telephone || null,
          date_naissance: formaterDate(ligne.date_naissance),
          lieu_naissance: ligne.lieu_naissance || null,
          date_embauche: formaterDate(ligne.date_embauche),
          date_fin_contrat: formaterDate(ligne.date_fin_contrat),
          role: ligne.role || "employe",
          photo: photosTrouvees,
          poste_actuel: posteId,
          horaire: horaireId  // ← Maintenant accepte le nom de l'horaire
        });
        
        // Hasher le mot de passe
        const salt = await bcrypt.genSalt(10);
        nouvelEmploye.mot_de_passe = await bcrypt.hash(nouvelEmploye.mot_de_passe, salt);
        
        await nouvelEmploye.save();
        
        resultats.crees.push({
          ligne: numLigne,
          matricule: matriculeStr,
          nom: ligne.nom,
          prenom: ligne.prenom,
          photos: photosTrouvees.length,
          horaire: horaireId ? "assigné" : "non assigné"
        });
        resultats.resume.crees++;
        
      } catch (err) {
        console.error(`Erreur ligne ${numLigne}:`, err);
        resultats.erreurs.push({
          ligne: numLigne,
          matricule: ligne.matricule || "?",
          erreur: err.message
        });
        resultats.resume.erreurs++;
      }
      
      resultats.resume.total++;
    }
    
    // Nettoyer les fichiers temporaires
    try {
      if (fs.existsSync(excelFile.path)) fs.unlinkSync(excelFile.path);
      if (fs.existsSync(zipFile.path)) fs.unlinkSync(zipFile.path);
    } catch(e) {
      console.log("Erreur nettoyage:", e);
    }
    
    res.status(200).json(resultats);
    
  } catch (error) {
    console.error("Erreur import:", error);
    res.status(500).json({ message: "Erreur lors de l'import", error: error.message });
  }
};

// Helper pour extraire le matricule depuis le nom du fichier
function extraireMatriculeDepuisNomFichier(nomFichier) {
  // Exemple: "EMP001_photo1.jpg" -> "EMP001"
  const match = nomFichier.match(/^([A-Za-z0-9]+)_/);
  return match ? match[1] : null;
}

module.exports = {
  getAllEmployes,
  getEmployeById,
  getCarriereEmploye,
  getPlanningEmploye,
  creerEmploye,
  gererCarriere,
  modifierEmploye,
  supprimerEmploye,
  importerEmployes,
  getEmployeIdsByDepartement,
};
