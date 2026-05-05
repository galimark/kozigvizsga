export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  const { modules, mode } = req.body;

  if (!modules || !Array.isArray(modules) || modules.length === 0) {
    return res.status(400).json({ error: 'modules array required' });
  }

  const TANKONYVTARTALOM = `KÖZIGAZGATÁSI ALAPVIZSGA – 15. kiadás (2026) főbb tényei:

=== 1. MODUL: ALKOTMÁNYOS ÉS JOGI ALAPISMERETEK ===
- A jog: állam által alkotott kötelező magatartási szabályok, kényszerrel érvényesítve
- Jogforrási hierarchia: alacsonyabb szintű jogforrás nem lehet ellentétes a magasabbal
- Alaptörvény: 2012. január 1-jén lépett hatályba, nincs száma, önálló megnevezése van
- Első írott alkotmány: 1949. évi XX. törvény
- Alkotmányos elvek: népszuverenitás, hatalmi ágak megosztása, jogegyenlőség, jogállamiság, törvények uralma, végrehajtó hatalom felelőssége, bírói függetlenség, alapvető jogok
- Választási rendszer: vegyes, 199 képviselő (106 egyéni, 93 listás), egyfordulós, 5% küszöb
- Szavazástípusok az Országgyűlésben:
  * Egyszerű/relatív többség: jelenlévők >50% (legtöbb törvény, "feles törvény")
  * Abszolút többség: összes képviselő >50% (miniszterelnök megválasztása)
  * Minősített többség: jelenlévők 2/3 (sarkalatos törvények)
  * Abszolút minősített többség: összes képviselő 2/3 (Alaptörvény módosítása)
- Közvetlen demokrácia: érvényességhez összes választópolgár >50%, eredményességhez szavazók >50% azonos szavazata
- Montesquieu: hatalmi ágak elmélete (törvényhozói, végrehajtói, bírói)
- Országgyűlés: megválasztja KE-t, ME-t, AB tagjait, Kúria elnökét, OBH elnökét, legfőbb ügyészt, alapjogi biztost, ÁSZ elnökét
- Mentelmi jog: felelőtlenség + sérthetetlenség
- Miniszterelnök: abszolút többséggel választja OGY; konstruktív bizalmatlansági indítvány: képviselők 1/5-e kezdeményezheti
- Köztársasági elnök: semleges hatalom, feltétel: 35 év, abszolút minősített többséggel, 5 évre, max. egyszer újraválasztható; megfosztáshoz: 1/5 kezdeményez, AB folytatja le
- Bíróságok: 4 szint: járásbíróság → törvényszék → ítélőtábla → Kúria; Kúria + OBH elnöke: 9 évre, kétharmaddal; hivatásos bírák: KE nevezi ki, feltétel: 35 év
- Ügyészség: centralizált, hierarchikus; legfőbb ügyész: OGY, kétharmad, 9 év; szintek: Legfőbb Ügyészség → fellebbviteli főügyészségek → főügyészségek → járási ügyészségek
- Alkotmánybíróság: Alaptörvény védelmének legfőbb szerve, nem bírósági rendszer, előzetes/utólagos normakontroll, "negatív jogalkotás"
- Alapjogi generációk: I. (élet, méltóság), II. (szociális, gazdasági, kulturális), III. (egészséges környezet)
- Abszolút jogok (nem korlátozható): élethez + méltósághoz való jog, férfiak-nők egyenjogúsága
- Jogforrások: Alaptörvény > sarkalatos törvény > törvény > kormányrendelet > miniszteri rendelet > önkormányzati rendelet

=== 2. MODUL: KÖZIGAZGATÁSI ALAPISMERETEK ===
- Kit. (2011. évi CXCIX.): kormánytisztviselők – Kormány irányítása alá tartozó szervek
- Küt. (2011. évi CXC.): köztisztviselők – helyi önkormányzati, AB, ÁSZ, stb.
- Közszolgálati jogviszony: kinevezés + eskütétel; próbaidő: 3-6 hónap
- Önálló szabályozó szervek: törvénnyel hozhatók létre (pl. Médiatanács, NMHH)
- Területi igazgatás: Fővárosi és Megyei Kormányhivatalok, kormánymegbízott vezeti
- Helyi önkormányzatok: képviselő-testület (döntéshozó) + polgármester (végrehajtó)
  Átruházhatatlan hatáskörök: helyi rendelet, SzMSz, költségvetés, helyi adók
- Ákr. (2016. évi CL., hatályos 2018. január 1-jétől): alapelvek: törvényesség, jóhiszeműség, bizalomvédelem, arányosság, ésszerű idő
- Határozat: érdemben dönt; Végzés: eljárási kérdés
- Ügyintézési határidő: főszabály 30 nap
- Jogorvoslat: fellebbezés, közigazgatási bírósági felülvizsgálat, újrafelvételi eljárás
- GRECO: Európa Tanács antikorrupciós szerve (Groupe d'États Contre la Corruption)
- Munkaidő: napi 8 óra, heti 40 óra; rendkívüli munkavégzés: évi max. 400 óra
- Teljesítményértékelés: évente kötelező; minősítések: Kiváló / Megfelelő / Nem megfelelő
- Magyary Zoltán Program (2011, 2012): közigazgatás-fejlesztési stratégia
- Jó Állam: eredményes, hatékony, átlátható, demokratikus közigazgatás

=== 3. MODUL: EURÓPAI UNIÓS ALAPISMERETEK ===
- 1951: Párizsi Szerződés – ESZAK (szén és acél)
- 1957: Római Szerződések – EGK + Euratom
- 1992: Maastrichti Szerződés – EU létrejötte, 3 pillér
- 2007: Lisszaboni Szerződés – hatályba: 2009. december 1.
- Lisszaboni újdonságok: állandó ET-elnök (2,5+2,5 év), külügyi főképviselő, polgári kezdeményezés (1 millió aláírás, 7 tagállam), 50. cikk (kilépési klauzula)
- Európai Tanács: állam-/kormányfők, NEM jogalkotó, politikai iránymutatás
- EU Tanács (Miniszterek Tanácsa): tagállami miniszterek, jogalkotás, forgó elnökség (6 hónap)
- Európai Parlament: közvetlen választás, 5 év, 720 képviselő (2024-től); Bizottság megbuktatása: kétharmad
- Európai Bizottság: tagállamonként 1 biztos, 5 év; elnöke: ET javasolja, EP választja
- EUB: EU jog egységes alkalmazása, előzetes döntéshozatal, kötelezettségszegési eljárás
- Euró: 1999 (könyvelési), 2002 (készpénz), jelenleg 20 euróövezeti tagállam
- EU jog sajátosságai: közvetlen hatály, közvetlen alkalmazhatóság, elsőbbség a nemzeti jog felett
- Rendeletek: kötelező, általánosan alkalmazandó, tagállami végrehajtás nem szükséges
- Irányelvek: cél kötelező, eszköz szabad
- Határozatok: kötelező az egész tartalmában, meghatározott személyekre
- Ajánlások/vélemények: nem kötelező
- Alapjogi Charta: 2000, kötelező a Lisszaboni Szerződéssel
- EJEE: Európa Tanács (nem EU!); szubszidiaritás elve

=== 4. MODUL: GAZDÁLKODÁSI ÉS PÉNZÜGYI ALAPISMERETEK ===
- GDP: egy ország területén adott időszakban megtermelt összes végső termék és szolgáltatás piaci értéke
- MNB: monetáris politika, elsődleges cél: árstabilitás; eszközök: alapkamat, kötelező tartalékráta, nyílt piaci műveletek
- 2013: MNB integrált pénzügyi felügyelet (átvette a PSZÁF feladatait)
- Államháztartás: központi alrendszer (állami ktgvetés + TB alapok + elkülönített alapok) + helyi önkormányzati alrendszer
- Közbevételek: szja, tao, áfa, jövedéki adó, járulékok, illetékek
- Közpénzek elvei: átláthatóság, ellenőrzöttség, célszerűség, hatékonyság, eredményesség
- Központi költségvetés: OGY fogadja el törvénnyel; ÁSZ ellenőrzi; Nemzetgazdasági Miniszter terjeszti elő
- Helyi önkormányzati ktgvetés: képviselő-testület fogadja el rendeletben
- Nemzeti vagyon: Alaptörvény 38. cikk; stratégiai vagyon tartós állami tulajdonban; privatizáció csak törvénnyel
- ÁSZ (Állami Számvevőszék): legfőbb pénzügyi-gazdasági ellenőrző szerv, OGY-nek felelős
- KEHI (Kormányzati Ellenőrzési Hivatal): Kormánynak felelős

=== 5. MODUL: INFORMÁCIÓBIZTONSÁGI ÉS ADATVÉDELMI ALAPISMERETEK ===
- GDPR: 2018. május 25-től alkalmazandó EU rendelet
- Személyes adat: azonosított/azonosítható természetes személyre vonatkozó adat
- Adatkezelés jogalapjai: hozzájárulás, szerződés, jogi kötelezettség, létfontosságú érdek, közfeladat, jogos érdek
- Érintett jogai: hozzáférés, helyesbítés, törlés (elfeledtetés), adathordozhatóság, tiltakozás, automatizált döntéshozatal alóli mentesség
- NAIH: Nemzeti Adatvédelmi és Információszabadság Hatóság
- Különleges adatok: faj/etnikum, politikai vélemény, vallás, szakszervezeti tagság, genetikai, biometrikus, egészségi, szexuális irányultság – főszabály: tilos kezelni
- Közérdekű adat: állami/önkormányzati szervek feladatkörével kapcsolatos adatok, bárki megismerheti
- Minősítési szintek + érvényességi idő: Korlátozott terjesztésű (5 év), Bizalmas (10 év), Titkos (20 év), Szigorúan titkos (30 év)
- Telephely biztonsági tanúsítvány: gazdasági szereplők kapják, akik minősített adatokat kezelnek
- EU AI Act (2024): AI rendszerek kockázati osztályait szabályozza

=== 6. MODUL: A KÖZIGAZGATÁSI SZERVEZETEK MŰKÖDÉSE ===
- Max Weber bürokrácia: hierarchia, munkamegosztás, írásbeliség, személytelenség, szakértelem
- Robert Merton: bürokratikus személyiség – túlzott szabálykövetés
- New Public Management (NPM): 1980-as évektől, piaci elvek a közigazgatásban
- New Public Governance (NPG): hálózati megközelítés, partnerség
- Vezetői funkciók: célkijelölés, tervezés, szervezés, leadership, kontroll
- Irányítás: teljes körű (utasítás, szervezés, felügyelet, ellenőrzés)
- Felügyelet: szűkebb, nincs teljes utasítási jog
- Ellenőrzés: csak megfigyelés/értékelés, beavatkozási jog nélkül
- E-közigazgatás: Ügyfélkapu/Ügyfélkapu+ azonosítás, SZEÜSZ, Digitális Állampolgárság Program
- BPMN (Business Process Modeling Notation): folyamatmodellezési módszertan
- Lean módszertan: veszteségek csökkentése a közigazgatásban

=== 7. MODUL: NEMZETPOLITIKA ===
- Alaptörvény D) cikk: Magyarország felelősséget érez a határain kívül élő magyarok sorsáért
- Nemzeti Összetartozás Napja: június 4. (Trianon); 2010. évi XLV. törvény
- Egyszerűsített honosítás: 2011. január 1-jétől; feltétel: magyar felmenő + magyar nyelvismeret; magyarországi lakóhely nem szükséges
- Bethlen Gábor Alap: határon túli magyarság támogatása; Bethlen Gábor Alapkezelő Zrt.
- Határtalanul! program: általános és középiskolások Kárpát-medencei osztálykirándulásának támogatása
- MÁÉRT (Magyar Állandó Értekezlet): 1999-ben alapítva, konzultációs fórum a határon túli magyarokkal
- Magyar Diaszpóra Tanács: nyugati diaszpóra szervezetek képviselete
- Kárpát-medencei Magyar Képviselők Fóruma: Kárpát-medencei magyarság által választott képviselők fóruma
- Az Országgyűlés Nemzeti Összetartozás Bizottsága: parlamenti bizottság`;

  const modePrompt = mode === 'blitz'
    ? 'Igaz/Hamis kérdéseket generálj. Az "answers" tömb PONTOSAN 2 elemet tartalmazzon: ["Igaz", "Hamis"]. A "correct" 0 ha Igaz, 1 ha Hamis.'
    : mode === 'deep'
    ? 'Nehéz, részletekre menő kérdéseket generálj: pontos számok, dátumok, törvényszámok, határidők. 4 válaszlehetőség, pontosan 1 helyes.'
    : 'Közepes nehézségű, 4 válaszlehetőséges kérdéseket generálj. Pontosan 1 helyes válasz.';

  const userPrompt = `A következő tankönyv tartalom alapján generálj pontosan 10 vizsgakérdést.

TANKÖNYV:
${TANKONYVTARTALOM}

KÉRDEZZ EZEKBŐL A MODULOKBÓL: ${modules.join(', ')}

MÓD: ${modePrompt}

Pontosan ezt a JSON formátumot add vissza, semmi más szöveg:
{"questions":[{"module":"modul neve","question":"kérdés szövege?","answers":["A","B","C","D"],"correct":0,"explanation":"1-2 mondatos magyarázat magyarul."}]}

A "correct" mező a helyes válasz indexe (0-tól számozva). Generálj pontosan 10 különböző kérdést a megadott modulokból.`;

  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        system: 'Te egy közigazgatási alapvizsga AI vizsgáztató vagy. KIZÁRÓLAG JSON-t válaszolj. Semmi más szöveg, semmi markdown, semmi backtick. Csak a nyers JSON objektum.',
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!anthropicRes.ok) {
      const err = await anthropicRes.text();
      return res.status(502).json({ error: 'Upstream error', detail: err });
    }

    const data = await anthropicRes.json();
    const raw = data.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('')
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const parsed = JSON.parse(raw);
    return res.status(200).json(parsed);
  } catch (err) {
    return res.status(500).json({ error: 'Internal error', detail: err.message });
  }
}
