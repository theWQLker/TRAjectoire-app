/**
 * FAMILY ROLLOUT pipeline (§4 front door, all 14 ROME grands domaines).
 *
 * For every family→depth (a depth = an explicit list of member ROME jobs,
 * decision 2026-11-21: no prefixes, so a new ROME code never joins a niche
 * without someone adding it here):
 *   1. niche members = the depth's listed jobs (a listed job missing from the
 *      graph is reported)
 *   2. seed = union of members' competence codes, DISTINCTIVE only (idf above the
 *      generic cutoff), every code VERIFIED present in rome_competences (0 fabricated)
 *   3. coverage proof: a representative member must hit ≥70% of its codes under
 *      the genericity bound from the seed (its coverage over all codes is shown too)
 *
 * Emits (--emit) the config/families.ts content with all verified seed arrays, and
 * always prints the per-depth coverage + fabrication report. Niche idiosyncrasy is
 * verified per depth, never assumed.
 *
 * Usage:
 *   node --env-file=.env.local node_modules/tsx/dist/cli.mjs scripts/build-families.ts [--emit > config/families.ts]
 */
import { getSupabaseServiceClient } from "../src/lib/supabase";
import { MAX_CODE_DOMAINES } from "../config/genericity";

async function fetchAll<T>(t: string, c: string): Promise<T[]> {
  const db = getSupabaseServiceClient();
  const P = 1000; const o: T[] = [];
  for (let f = 0; ; f += P) {
    const { data, error } = await db.from(t).select(c).range(f, f + P - 1);
    if (error) throw new Error(`${t}: ${error.message}`);
    if (!data || !data.length) break;
    for (const r of data as T[]) o.push(r);
    if (data.length < P) break;
  }
  return o;
}

type DepthDef = { id: string; label: string; members: string[]; proveOn: string; persona: string };
type FamilyDef = { id: string; label: string; domaines: string; depths: DepthDef[] };

// All 14 domaines covered. Each depth's proveOn is a representative member job;
// persona is a one-line note of who picks it (for the batch persona test).
const FAMILIES: FamilyDef[] = [
  { id: "tech", label: "Informatique et numérique", domaines: "M18 / I14", depths: [
    { id: "code", label: "Développer / coder", members: ["M1801","M1802","M1803","M1804","M1805","M1806","M1807","M1808","M1809","M1820","M1821","M1822","M1823","M1824","M1825","M1826","M1827","M1828","M1829","M1840","M1841","M1842","M1843","M1844","M1845","M1846","M1847","M1848","M1849","M1850","M1851","M1852","M1853","M1854","M1855","M1856","M1857","M1858","M1859"], proveOn: "M1805", persona: "développeur" },
    { id: "sysadmin", label: "Systèmes & réseaux", members: ["M1810","M1811","M1812","M1813","M1814","M1815","M1816","M1817","M1818","M1819"], proveOn: "M1810", persona: "admin systèmes" },
    { id: "support", label: "Support / dépannage info", members: ["I1401","I1402","I1403","I1404","I1405","I1406","I1407","I1408","I1409"], proveOn: "I1401", persona: "support IT" },
    { id: "data", label: "Données / data", members: ["M1401","M1402","M1403","M1404","M1405","M1406","M1407","M1408","M1409","M1830","M1831","M1832","M1833","M1834","M1835","M1836","M1837","M1838","M1839"], proveOn: "M1403", persona: "data analyst" },
  ]},
  { id: "sante", label: "Santé et soin", domaines: "J", depths: [
    { id: "soin", label: "Soin / aide-soignant·e", members: ["J1501","J1502","J1503","J1504","J1505","J1506","J1507","J1508","J1509","J1510","J1511","J1512"], proveOn: "J1501", persona: "aide-soignant" },
    { id: "medico", label: "Médico-technique", members: ["J1301","J1302","J1303","J1304","J1305","J1306","J1307","J1308","J1309"], proveOn: "J1302", persona: "technicien labo" },
    { id: "reeduc", label: "Rééducation / paramédical", members: ["J1401","J1402","J1403","J1404","J1405","J1406","J1407","J1408","J1409","J1410","J1411","J1412","J1413","J1414","J1415","J1416"], proveOn: "J1404", persona: "kiné" },
  ]},
  { id: "btp", label: "Construction et bâtiment", domaines: "F", depths: [
    { id: "gros", label: "Gros œuvre / maçonnerie", members: ["F1701","F1702","F1703","F1704","F1705","F1706","F1707","F1708","F1709"], proveOn: "F1701", persona: "maçon" },
    { id: "second", label: "Second œuvre / finitions", members: ["F1601","F1602","F1603","F1604","F1605","F1606","F1607","F1608","F1609"], proveOn: "F1602", persona: "électricien bâtiment" },
    { id: "conduite", label: "Conduite & encadrement chantier", members: ["F1101","F1102","F1103","F1104","F1105","F1106","F1107","F1108","F1109","F1201","F1202","F1203","F1204","F1205","F1206","F1207","F1208","F1209"], proveOn: "F1201", persona: "conducteur travaux" },
  ]},
  { id: "maintenance", label: "Maintenance et technique", domaines: "I", depths: [
    { id: "indus", label: "Maintenance industrielle", members: ["I1301","I1302","I1303","I1304","I1305","I1306","I1307","I1308","I1309"], proveOn: "I1304", persona: "technicien maintenance" },
    { id: "vehicule", label: "Mécanique véhicules", members: ["I1601","I1602","I1603","I1604","I1605","I1606","I1607","I1608","I1609"], proveOn: "I1604", persona: "mécanicien auto" },
    { id: "batiment", label: "Maintenance bâtiment", members: ["I1201","I1202","I1203","I1204","I1205","I1206","I1207","I1208","I1209"], proveOn: "I1203", persona: "agent d'entretien" },
  ]},
  { id: "commerce", label: "Commerce et vente", domaines: "D", depths: [
    { id: "vente", label: "Vente / conseil client", members: ["D1201","D1202","D1203","D1204","D1205","D1206","D1207","D1208","D1209","D1210","D1211","D1212","D1213","D1214","D1215","D1216","D1217","D1218","D1219","D1220","D1221","D1222","D1223","D1224","D1225","D1226","D1227","D1228","D1229","D1230","D1231","D1232","D1233","D1234","D1235","D1236","D1237","D1238","D1239","D1240","D1241","D1242","D1243","D1244","D1245","D1246","D1247","D1248","D1249","D1250","D1251","D1252","D1253","D1254"], proveOn: "D1214", persona: "vendeur" },
    { id: "caisse", label: "Caisse / mise en rayon", members: ["D1501","D1502","D1503","D1504","D1505","D1506","D1507","D1508","D1509","D1510","D1511","D1512","D1513","D1514","D1515","D1516","D1517"], proveOn: "D1505", persona: "employé libre-service" },
    { id: "commercial", label: "Commercial / négociation", members: ["D1401","D1402","D1403","D1404","D1405","D1406","D1407","D1408","D1409","D1410","D1411","D1412","D1413","D1414","D1415","D1416","D1417","D1418","D1419","D1420","D1421","D1422","D1423","D1424","D1425","D1426","D1427","D1428","D1429","D1430","D1431","D1432","D1433","D1434","D1435","D1436","D1437","D1438","D1439","D1440","D1441","D1442","D1443","D1444"], proveOn: "D1402", persona: "commercial" },
    { id: "alimentaire", label: "Métiers de bouche / commerce alimentaire", members: ["D1101","D1102","D1103","D1104","D1105","D1106","D1107","D1108","D1109","D1110","D1111","D1112","D1113","D1114","D1115","D1116","D1117","D1118","D1119","D1120"], proveOn: "D1102", persona: "boulanger" },
    { id: "magasin", label: "Gestion de magasin / point de vente", members: ["D1301","D1302","D1303","D1304","D1305"], proveOn: "D1302", persona: "responsable de boutique" },
  ]},
  { id: "industrie", label: "Industrie et production", domaines: "H", depths: [
    { id: "production", label: "Conduite de production", members: ["H2801","H2802","H2803","H2804","H2805","H2806","H2807","H2808","H2809","H2810","H2811","H3301","H3302","H3303","H3304","H3305","H3306","H3307","H3308","H3309"], proveOn: "H2801", persona: "opérateur production" },
    { id: "qualite", label: "Qualité / méthodes", members: ["H1501","H1502","H1503","H1504","H1505","H1506","H1507","H1508","H1509","H1510","H1511","H1512","H1513","H1514","H1515","H1516","H1517","H1518","H1519","H1520","H1521","H1522","H1523","H1524","H1525","H1526","H1527","H1528","H1529","H1530","H1531","H1532","H1533","H1534","H1535"], proveOn: "H1502", persona: "qualiticien" },
    { id: "montage", label: "Montage / assemblage", members: ["H2901","H2902","H2903","H2904","H2905","H2906","H2907","H2908","H2909","H2910","H2911","H2912","H2913","H2914","H2915","H2916","H2917","H2918","H2919","H2920","H2921","H2922","H2923","H2924","H2925"], proveOn: "H2902", persona: "monteur" },
    { id: "etudes", label: "Études, R&D, bureau d'études", members: ["H1201","H1202","H1203","H1204","H1205","H1206","H1207","H1208","H1209","H1210","H1211","H1212","H1213","H1214","H1215","H1216","H1217","H1218","H1219","H1220","H1221","H1222","H1223","H1224","H1225","H1226","H1227","H1228","H1229","H1230","H1231","H1232","H1233","H1234","H1235","H1236","H1237","H1238","H1239","H1240","H1241","H1242","H1243","H1244","H1245","H1246"], proveOn: "H1206", persona: "ingénieur R&D" },
  ]},
  { id: "hotellerie", label: "Hôtellerie, restauration", domaines: "G", depths: [
    { id: "cuisine", label: "Cuisine", members: ["G1601","G1602","G1603","G1604","G1605","G1606","G1607","G1608","G1609","G1610","G1611","G1612","G1613"], proveOn: "G1602", persona: "cuisinier" },
    { id: "salle", label: "Service en salle", members: ["G1801","G1802","G1803","G1804","G1805","G1806","G1807","G1808","G1809","G1810"], proveOn: "G1803", persona: "serveur" },
    { id: "accueil", label: "Accueil / hébergement", members: ["G1201","G1202","G1203","G1204","G1205","G1206","G1207","G1208","G1209","G1210","G1211","G1212","G1213","G1214","G1215","G1216","G1217","G1218","G1219","G1220","G1221","G1222","G1223","G1224","G1225","G1226","G1227","G1228","G1229","G1230","G1231","G1232","G1233","G1234","G1235","G1236","G1237","G1238","G1239","G1240","G1241","G1242","G1243","G1244","G1245","G1246","G1247","G1248","G1249"], proveOn: "G1206", persona: "réceptionniste" },
    { id: "direction", label: "Direction d'établissement (hôtel, restaurant, loisirs)", members: ["G1401","G1402","G1403","G1404","G1405","G1406","G1407","G1408","G1409","G1410","G1411","G1412","G1413","G1414","G1415","G1416","G1417","G1418"], proveOn: "G1411", persona: "directeur d'hôtel" },
  ]},
  { id: "admin", label: "Administration, gestion, RH", domaines: "M (support)", depths: [
    { id: "secretariat", label: "Secrétariat / assistanat", members: ["M1601","M1602","M1604","M1605","M1606","M1607","M1608","M1609","M1611","M1612","M1613","M1614","M1616","M1621"], proveOn: "M1607", persona: "secrétaire" },
    { id: "compta", label: "Comptabilité / paie", members: ["M1201","M1202","M1203","M1204","M1205","M1206","M1207","M1208","M1209"], proveOn: "M1203", persona: "comptable" },
    { id: "rh", label: "Ressources humaines", members: ["M1501","M1502","M1503","M1504","M1505","M1507","M1508","M1509","M1510","M1511","M1512"], proveOn: "M1501", persona: "assistant RH" },
  ]},
  { id: "droit", label: "Droit", domaines: "K19", depths: [
    { id: "juridique", label: "Droit / juridique", members: ["K1901","K1902","K1903","K1904","K1905","K1906","K1907","K1908","K1909","K1910","K1911","K1912","K1913","K1914","K1915","K1916","K1923","K1924"], proveOn: "K1903", persona: "juriste" },
  ]},
  { id: "agriculture", label: "Agriculture, espaces naturels", domaines: "A", depths: [
    { id: "culture", label: "Culture / élevage", members: ["A1401","A1402","A1403","A1404","A1405","A1406","A1407","A1408","A1409","A1410","A1411","A1412","A1413","A1414","A1415","A1416","A1417","A1418","A1419","A1420","A1421","A1422","A1423","A1424","A1425","A1426","A1427","A1428","A1429","A1430","A1431","A1432","A1433","A1434","A1435","A1436","A1437","A1438","A1439","A1440","A1441","A1442","A1443","A1444","A1445","A1446","A1447"], proveOn: "A1416", persona: "agriculteur" },
    { id: "paysage", label: "Paysage / espaces verts", members: ["A1301","A1302","A1303","A1304","A1305","A1306","A1307","A1308","A1309","A1310","A1311","A1312","A1313","A1314","A1315","A1316","A1317","A1318","A1319","A1320","A1321","A1322","A1323","A1324","A1325"], proveOn: "A1301", persona: "jardinier" },
    { id: "foret", label: "Forêt / nature", members: ["A1201","A1202","A1203","A1204","A1205","A1206","A1207","A1208","A1209","A1210","A1211","A1212","A1213","A1214","A1215","A1216","A1217","A1218","A1219","A1220","A1221"], proveOn: "A1201", persona: "agent forestier" },
  ]},
  { id: "artisanat", label: "Arts et artisanat", domaines: "B / L", depths: [
    { id: "art", label: "Artisanat d'art", members: ["B1601","B1602","B1603","B1604","B1605","B1606","B1607","B1608","B1609","B1610","B1611","B1612","B1613","B1614","B1615","B1616","B1617","B1618","B1801","B1802","B1803","B1804","B1805","B1806","B1807","B1808","B1809","B1810","B1811","B1812","B1813","B1814","B1815","B1816"], proveOn: "B1601", persona: "artisan d'art" },
    { id: "spectacle", label: "Spectacle / technique", members: ["L1501","L1502","L1503","L1504","L1505","L1506","L1507","L1508","L1509","L1510","L1511","L1512","L1513","L1514","L1515","L1516","L1517","L1518","L1519","L1520","L1521","L1522","L1523","L1524","L1525","L1526","L1527","L1528"], proveOn: "L1509", persona: "technicien spectacle" },
    { id: "creation", label: "Création / interprétation", members: ["L1201","L1202","L1203","L1204","L1205","L1206","L1207","L1208","L1209","L1210","L1211","L1212","L1213","L1214","L1215","L1216","L1301","L1302","L1303","L1304","L1305","L1306","L1307","L1308","L1309","L1310","L1311","L1312","L1313","L1314","L1315","L1316","L1317","L1318","L1319","L1320"], proveOn: "L1301", persona: "artiste" },
  ]},
  { id: "banque", label: "Banque, assurance, immobilier", domaines: "C", depths: [
    { id: "banque", label: "Banque / clientèle", members: ["C1101","C1102","C1103","C1104","C1105","C1106","C1107","C1108","C1109","C1110","C1111","C1112","C1113","C1114","C1115","C1116","C1117","C1118","C1119","C1120","C1121","C1122","C1123","C1124","C1125","C1126","C1127","C1128","C1129","C1130"], proveOn: "C1102", persona: "conseiller bancaire" },
    { id: "assurance", label: "Assurance", members: ["C1201","C1202","C1203","C1204","C1205","C1206","C1207","C1208","C1209","C1210","C1211","C1212","C1213","C1214","C1215","C1216","C1217"], proveOn: "C1201", persona: "conseiller assurance" },
    { id: "immo", label: "Immobilier", members: ["C1501","C1502","C1503","C1504","C1505","C1506","C1507","C1508"], proveOn: "C1504", persona: "agent immobilier" },
  ]},
  { id: "communication", label: "Communication et médias", domaines: "E", depths: [
    { id: "comm", label: "Communication / relations publiques", members: ["E1101","E1102","E1103","E1104","E1105","E1106","E1107","E1108","E1109","E1110","E1111","E1112","E1113","E1114","E1115","E1116","E1117","E1118","E1119","E1120","E1121","E1122","E1123","E1124","E1125","E1126","E1127","E1128","E1129","E1130","E1131","E1132","E1133","E1134"], proveOn: "E1103", persona: "chargé de com" },
    { id: "design", label: "Design / création visuelle", members: ["E1201","E1202","E1203","E1204","E1205","E1206","E1207","E1208","E1209","E1210","E1211","E1212","E1213","E1214"], proveOn: "E1205", persona: "designer graphique" },
    { id: "audiovisuel", label: "Audiovisuel / multimédia", members: ["E1301","E1302","E1303","E1304","E1305","E1306","E1307","E1308","E1309","E1310","E1311","E1312","E1313","E1314","E1315","E1316","E1401","E1402","E1403","E1404","E1405","E1406","E1407","E1408","E1409","E1410","E1411","E1412","E1413","E1414","E1415"], proveOn: "E1401", persona: "technicien audiovisuel" },
  ]},
  { id: "social", label: "Social et éducation", domaines: "K12 / K13 / K18 / K21", depths: [
    { id: "social", label: "Action sociale / éducative", members: ["K1201","K1202","K1203","K1204","K1205","K1206","K1207","K1208","K1209","K1210","K1211","K1212","K1213","K1214","K1215","K1216","K1217","K1218","K1219","K1220","K1221","K1222","K1223","K1224","K1225","K1226","K1227","K1228","K1229","K1230"], proveOn: "K1207", persona: "éducateur" },
    { id: "enseignement", label: "Enseignement / formation", members: ["K2101","K2102","K2103","K2104","K2105","K2106","K2107","K2108","K2109","K2110","K2111","K2112","K2113","K2114","K2115","K2116","K2117","K2118","K2119","K2120","K2121","K2122","K2123","K2124","K2125","K2126","K2127","K2128","K2129","K2130","K2131","K2132","K2133","K2134","K2135","K2136","K2137","K2138","K2139","K2140","K2141","K2142","K2143","K2144","K2145","K2146","K2147","K2148"], proveOn: "K2104", persona: "enseignant" },
    { id: "domicile", label: "Aide à domicile / à la personne", members: ["K1301","K1302","K1303","K1304","K1305","K1306","K1307","K1308","K1309","K1310","K1311","K1312","K1313","K1314"], proveOn: "K1302", persona: "aide à domicile" },
    { id: "territoire", label: "Développement local, emploi, insertion", members: ["K1801","K1802","K1803","K1804","K1805","K1806","K1807","K1808","K1809","K1810","K1811","K1812","K1813","K1814","K1815","K1816","K1817"], proveOn: "K1809", persona: "chargé de développement territorial" },
  ]},
  { id: "securite", label: "Sécurité, défense, secours", domaines: "K17 / K25", depths: [
    { id: "securite", label: "Sécurité / défense", members: ["K1701","K1702","K1703","K1704","K1705","K1706","K1707","K1708","K1709","K1710","K1711","K1712","K1713","K1714","K1715","K1716","K1717","K1718","K1719","K1720","K1721","K1722","K1723","K1724","K1725","K1726","K1727","K1728","K1729","K1730","K1731","K1732","K1733","K1734","K1735","K1736","K1737","K1738","K1739","K1740","K1741","K1742","K1743","K1744","K1745","K1746","K1747","K1748","K2501","K2502","K2503","K2504","K2505","K2506","K2507","K2508","K2509","K2510","K2511","K2512","K2513","K2514"], proveOn: "K2503", persona: "agent de sécurité" },
  ]},
  { id: "proprete", label: "Nettoyage, propreté, déchets", domaines: "K23", depths: [
    { id: "proprete", label: "Propreté urbaine / déchets", members: ["K2301","K2302","K2303","K2304","K2305","K2306","K2307","K2308","K2309","K2310","K2311","K2312","K2313","K2314","K2315","K2316","K2317","K2318","K2319","K2320","K2321","K2322","K2323","K2324","K2325","K2326"], proveOn: "K2307", persona: "agent de propreté urbaine" },
  ]},
  { id: "transport", label: "Transport et logistique", domaines: "N", depths: [
    { id: "conduite", label: "Conduite / livraison", members: ["N4101","N4102","N4103","N4104","N4105","N4106","N4107","N4108","N4109","N4110","N4111","N4112","N4113","N4114","N4115","N4116","N4117","N4118","N4119","N4120","N4121","N4122","N4123","N4124","N4125","N4126","N4127","N4128","N4129","N4130","N4131","N4132","N4133","N4134","N4135","N4401","N4402","N4403","N4404","N4405","N4406"], proveOn: "N4101", persona: "chauffeur" },
    { id: "entrepot", label: "Entrepôt / manutention", members: ["N1101","N1102","N1103","N1104","N1105","N1106","N1107","N1108","N1109","N1110","N1111","N1112","N1113","N1114","N1115","N1116"], proveOn: "N1103", persona: "préparateur commandes" },
    { id: "exploitation", label: "Exploitation / planification", members: ["N1201","N1202","N1203","N1204","N1205","N1206","N1207","N1208","N1209","N1210","N1301","N1302","N1303","N1304","N1305","N1306","N1307","N1308"], proveOn: "N1303", persona: "agent logistique" },
  ]},
];

// LEAK GUARD (decision 2026-11-20): a niche's seed carries no skill that its
// leak target carries. The RH and secretariat seeds shared skills with
// téléconseil (D1408), which kept D1408 at #1 for a seeded HR profile
// (scripts/d1408-diagnosis.ts). Dropped from the seed and from the members'
// distinctive codes alike, so job-level exclusion stays consistent.
const LEAK_GUARD: Record<string, string[]> = {
  "admin:rh": ["D1408"],
  "admin:secretariat": ["D1408"],
  // New niches (decision 2026-11-21) carry the same guard.
  "commerce:alimentaire": ["D1408"],
  "proprete:proprete": ["D1408"],
  "industrie:etudes": ["D1408"],
  "droit:juridique": ["D1408"],
  "commerce:magasin": ["D1408"],
  "hotellerie:direction": ["D1408"],
  "social:territoire": ["D1408"],
};

async function main() {
  const emit = process.argv.includes("--emit");
  const links = await fetchAll<{ rome_code: string; competence_code: string }>("rome_job_competences", "rome_code, competence_code");
  const comps = await fetchAll<{ code: string; libelle: string }>("rome_competences", "code, libelle");
  const jobs = await fetchAll<{ rome_code: string; title: string }>("rome_jobs", "rome_code, title");
  const existing = new Set(comps.map((c) => c.code));
  const title = new Map(jobs.map((j) => [j.rome_code, j.title]));

  const codesByJob = new Map<string, Set<string>>();
  const df = new Map<string, number>();
  for (const l of links) {
    const s = codesByJob.get(l.rome_code) ?? new Set<string>();
    if (!s.has(l.competence_code)) df.set(l.competence_code, (df.get(l.competence_code) ?? 0) + 1);
    s.add(l.competence_code); codesByJob.set(l.rome_code, s);
  }
  const N = jobs.length;
  const idf = (c: string) => Math.log((N + 1) / ((df.get(c) ?? 0) + 1));
  const GENERIC_CUTOFF = Math.log((N + 1) / (N * 0.15 + 1)); // generic if below
  const allJobCodes = [...codesByJob.keys()];
  // Domaines professionnels (3-char ROME prefix) listing each code: a code in
  // more than MAX_CODE_DOMAINES of them is a macro-competence, never a seed code.
  const domainesOf = new Map<string, Set<string>>();
  for (const [job, codes] of codesByJob) for (const c of codes) {
    const s = domainesOf.get(c) ?? new Set<string>(); s.add(job.slice(0, 3)); domainesOf.set(c, s);
  }
  const concentrated = (c: string) => (domainesOf.get(c)?.size ?? 0) <= MAX_CODE_DOMAINES;

  const seedArrays: Record<string, string[]> = {};
  // per depth: member jobs with their DISTINCTIVE codes (for the opt-in job-level
  // exclusion — the UI lists these members; the engine subtracts a rejected job's
  // codes that no OTHER member carries).
  const memberArrays: Record<string, { romeCode: string; title: string; codes: string[] }[]> = {};
  const report: { fam: string; depth: string; members: number; seed: number; proveOn: string; covAll: number; cov: number; fab: number; pass: boolean }[] = [];

  for (const fam of FAMILIES) {
    for (const d of fam.depths) {
      const members = d.members.filter((j) => codesByJob.has(j));
      const absent = d.members.filter((j) => !codesByJob.has(j));
      if (absent.length) console.error(`${fam.id}:${d.id}: member jobs not in the graph: ${absent.join(", ")}`);
      const guarded = new Set<string>();
      for (const job of LEAK_GUARD[`${fam.id}:${d.id}`] ?? []) for (const c of codesByJob.get(job) ?? []) guarded.add(c);
      const seedSet = new Set<string>();
      for (const m of members) for (const code of codesByJob.get(m) ?? []) {
        if (idf(code) >= GENERIC_CUTOFF && !guarded.has(code) && concentrated(code)) seedSet.add(code); // distinctive, leak-guarded, domain-concentrated
      }
      const seed = [...seedSet].filter((c) => existing.has(c)).sort((a, b) => idf(b) - idf(a));
      const fab = [...seedSet].filter((c) => !existing.has(c)).length;
      // Coverage proof (decision 2026-11-22): the representative job's codes
      // UNDER the genericity bound must be >= 70% in the seed. Codes above the
      // bound are left out of every seed by design, so they are not counted as
      // missing. covAll (over every code of the job) is printed alongside.
      const proveAll = codesByJob.get(d.proveOn) ?? new Set<string>();
      const proveCodes = [...proveAll].filter(concentrated);
      const hit = proveCodes.filter((c) => seedSet.has(c)).length;
      const covAll = proveAll.size ? ([...proveAll].filter((c) => seedSet.has(c)).length / proveAll.size) * 100 : 0;
      const cov = proveCodes.length ? (hit / proveCodes.length) * 100 : 0;
      const pass = cov >= 70 && fab === 0;
      seedArrays[`${fam.id}:${d.id}`] = seed;
      // member jobs + each one's DISTINCTIVE codes (the ones in the seed set),
      // sorted by title for a stable UI list.
      memberArrays[`${fam.id}:${d.id}`] = members
        .map((m) => ({
          romeCode: m,
          title: title.get(m) ?? m,
          codes: [...(codesByJob.get(m) ?? [])].filter((c) => seedSet.has(c)).sort(),
        }))
        .sort((a, b) => a.title.localeCompare(b.title));
      report.push({ fam: fam.id, depth: d.id, members: members.length, seed: seed.length, proveOn: d.proveOn, covAll, cov, fab, pass });
    }
  }

  if (emit) {
    // print a TS module
    console.log(genConfig(FAMILIES, seedArrays, memberArrays));
    return;
  }

  console.log("=".repeat(96));
  console.log("FAMILY ROLLOUT — coverage of representative job by niche-union seed (≥70% + 0 fabricated = PASS)");
  console.log("=".repeat(96));
  let pass = 0, fail = 0;
  let curFam = "";
  for (const r of report) {
    if (r.fam !== curFam) { curFam = r.fam; console.log(`\n${r.fam}`); }
    const mark = r.pass ? "✓" : "✗";
    console.log(`  ${mark} ${r.depth.padEnd(14)} niche=${String(r.members).padStart(3)} seed=${String(r.seed).padStart(3)} fab=${r.fab}  proveOn ${r.proveOn} ${(title.get(r.proveOn)??"?").slice(0,32).padEnd(32)} cov ${r.cov.toFixed(0).padStart(3)}% (all codes ${r.covAll.toFixed(0).padStart(3)}%)`);
    if (r.pass) pass++; else fail++;
  }
  console.log(`\n${"=".repeat(96)}`);
  console.log(`TOTAL depths: ${report.length}  PASS: ${pass}  FAIL: ${fail}`);
  const fails = report.filter((r) => !r.pass);
  if (fails.length) {
    console.log("\nFAILING DEPTHS (need attention — bad proveOn code, wrong member list, or genuinely inexpressible):");
    for (const r of fails) console.log(`  ${r.fam}:${r.depth} — proveOn ${r.proveOn} cov ${r.cov.toFixed(0)}% fab ${r.fab} (proveOn exists in graph: ${codesByJob.has(r.proveOn)})`);
  }
}

function genConfig(
  fams: FamilyDef[],
  seeds: Record<string, string[]>,
  members: Record<string, { romeCode: string; title: string; codes: string[] }[]>,
): string {
  const memberBlock = (m: { romeCode: string; title: string; codes: string[] }) =>
    `{ romeCode: ${JSON.stringify(m.romeCode)}, title: ${JSON.stringify(m.title)}, codes: ${JSON.stringify(m.codes)} }`;
  const depthBlock = (famId: string, d: DepthDef) => {
    const ms = members[`${famId}:${d.id}`] ?? [];
    return `      { id: ${JSON.stringify(d.id)}, label: ${JSON.stringify(d.label)}, seedCodes: ${JSON.stringify(seeds[`${famId}:${d.id}`] ?? [])},\n        members: [\n${ms.map((m) => `          ${memberBlock(m)},`).join("\n")}\n        ] },`;
  };
  const famBlock = (f: FamilyDef) =>
    `  {\n    id: ${JSON.stringify(f.id)},\n    label: ${JSON.stringify(f.label)},\n    domaines: ${JSON.stringify(f.domaines)},\n    depths: [\n${f.depths.map((d) => depthBlock(f.id, d)).join("\n")}\n    ],\n  },`;
  return `/**
 * Front-door FAMILIES + DEPTH sub-choices (BUILD_BRIEF §4). GENERATED by
 * scripts/build-families.ts from the live ROME graph — every seedCode is the
 * niche-union of distinctive competence codes for that depth, VERIFIED present in
 * rome_competences (zero fabricated). Re-generate after a graph re-ingest.
 *
 * Seed is ADDITIVE (never a filter): a picked niche injects its real distinctive
 * codes into the inventory; cross-domain bridges + the firehose guard stay intact.
 * Rarity-weighting (idf ≈ 6.8 on these codes) lifts the seeded niche's jobs, and
 * rarity-aware Signal tiers read them honestly.
 *
 * Leak guard (build-families.ts LEAK_GUARD): the guarded niches (admin:rh,
 * admin:secretariat and the others listed there) carry no skill that téléconseil
 * (D1408) carries.
 *
 * Genericity bound (config/genericity.ts): no seed carries a code listed in more
 * than MAX_CODE_DOMAINES ROME domaines.
 *
 * Each depth also carries its niche MEMBER jobs (romeCode, title, distinctive
 * codes) — the data the OPT-IN job-level exclusion needs: the UI lists these
 * members; excludedSeedCodesFor removes a rejected job's codes that NO OTHER
 * member carries (shared codes survive automatically).
 */

import { FAMILY_ALIASES } from "./family-aliases";

export type NicheMember = { romeCode: string; title: string; codes: string[] };
export type Depth = { id: string; label: string; seedCodes: string[]; members: NicheMember[] };
export type Family = { id: string; label: string; domaines: string; depths: Depth[] };

export const FAMILIES: Family[] = [
${fams.map(famBlock).join("\n")}
];

/**
 * Stored tokens → current tokens (config/family-aliases.ts). A token that is not
 * an alias passes through unchanged; a bare family alias expands to its depths.
 */
export function resolvePicks(picks: string[]): string[] {
  return picks.flatMap((p) => FAMILY_ALIASES[p] ?? [p]);
}

/** Exclusions keyed by stored tokens, re-keyed to current tokens. */
function resolveExclusions(exclusions: Record<string, string[]>): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const [pick, romes] of Object.entries(exclusions)) {
    for (const p of resolvePicks([pick])) out[p] = [...(out[p] ?? []), ...romes];
  }
  return out;
}

function findDepth(pick: string): Depth | undefined {
  const resolved = resolvePicks([pick]);
  if (resolved.length !== 1) return undefined;
  const [familyId, depthId] = resolved[0].split(":");
  return FAMILIES.find((f) => f.id === familyId)?.depths.find((d) => d.id === depthId);
}

/** Resolve the seed codes for a list of picked "familyId:depthId" tokens. */
export function seedCodesFor(picks: string[]): string[] {
  const out = new Set<string>();
  for (const pick of resolvePicks(picks)) {
    const depth = findDepth(pick);
    if (depth) for (const code of depth.seedCodes) out.add(code);
  }
  return [...out];
}

/**
 * Codes to DROP for an excluded job, WITHIN its depth: the rejected job's
 * distinctive codes that NO OTHER member of the same niche carries. Codes it
 * shares with a kept member are NOT dropped — they belong to the kept jobs too.
 * romeCode not in the depth → drops nothing.
 */
export function excludedCodesFor(pick: string, rejectedRome: string): string[] {
  const depth = findDepth(pick);
  if (!depth) return [];
  const rejected = depth.members.find((m) => m.romeCode === rejectedRome);
  if (!rejected) return [];
  const keptCodes = new Set<string>();
  for (const m of depth.members) {
    if (m.romeCode === rejectedRome) continue;
    for (const c of m.codes) keptCodes.add(c);
  }
  return rejected.codes.filter((c) => !keptCodes.has(c));
}

/**
 * The seed codes for picks MINUS the codes distinctive to only the rejected jobs.
 * exclusions maps a pick token to an array of rejected romeCodes within that niche.
 * Non-excluded picks contribute their full seedCodes. Exclusion only removes the
 * rejected job's OWN contribution; shared + other-family codes survive.
 */
export function seedCodesWithExclusions(
  picks: string[],
  exclusions: Record<string, string[]>,
): string[] {
  const drop = new Set<string>();
  const resolved = resolveExclusions(exclusions);
  for (const pick of resolvePicks(picks)) {
    for (const rome of resolved[pick] ?? []) {
      for (const c of excludedCodesFor(pick, rome)) drop.add(c);
    }
  }
  return seedCodesFor(picks).filter((c) => !drop.has(c));
}
`;
}

main().catch((e) => { console.error(e); process.exit(1); });
