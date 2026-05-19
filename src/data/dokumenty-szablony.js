// Szablony dokumentów Skautów Europy — wersje wysokiej jakości (z PDF)
// {{variable}} = auto-fill z meta
// {{CHOICE:id:opcja1|opcja2}} = klikalne pole wyboru (żółte)

const SENDER = `
<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:22px;font-size:10pt;">
  <div>
    <div style="font-weight:bold;">Skauci Europy</div>
    <div>Stowarzyszenie Harcerstwa Katolickiego „Zawisza"</div>
    <div>Federacja Skautingu Europejskiego</div>
    <div style="margin-top:6px;"><b>Hufiec:</b> {{hufiec}}</div>
    <div style="margin-top:8px;"><b>Kierownik wypoczynku:</b></div>
    <div>Imię i nazwisko: {{kierownik}}</div>
    <div>E-mail: {{email}}</div>
    <div>Telefon: {{tel_kierownik}}</div>
  </div>
  <div style="text-align:right;white-space:nowrap;">{{miejsce}}, dnia {{data_dzis}}</div>
</div>`

export const DOC_TEMPLATES = {

  zawiadomienie: {
    label: 'Zawiadomienie o obozie',
    icon: '📨',
    multiRecipient: true,
    recipients: [
      { id: 'policja',      label: 'Policja',              addr: 'Komenda Powiatowa Policji w {{powiat}}' },
      { id: 'psp',          label: 'Straż Pożarna (PSP)',  addr: 'Komenda Powiatowa PSP w {{powiat}}\n{{psp}}' },
      { id: 'szpital',      label: 'Szpital/Przychodnia',  addr: '{{szpital}}' },
      { id: 'wojt',         label: 'Wójt/Sołtys',         addr: 'Wójt Gminy {{gmina}}' },
      { id: 'nadlesnictwo', label: 'Nadleśnictwo',         addr: 'Nadleśnictwo {{nadlesnictwo}}' },
    ],
    html: `${SENDER}
<div style="margin-bottom:18px;">{{recipient_name}}</div>

<p style="font-weight:bold;text-align:center;font-size:12pt;margin:18px 0 14px;">Zawiadomienie o organizacji obozu harcerskiego</p>

<p>Szanowni Państwo,</p>
<p>zgodnie z „Protokołem Uzgodnień w zakresie bezpieczeństwa na obozach harcerskich pod namiotami" z dnia 19 czerwca 2019 r. uprzejmie informuję, że w terminie od <b>{{date_start}}</b> do <b>{{date_end}}</b> na terenie Nadleśnictwa <b>{{nadlesnictwo}}</b>, w obrębie leśnictwa <b>{{lesnictwo}}</b> (oddział leśny nr <b>{{oddzial_lesny}}</b>), odbędzie się obóz harcerski <b>{{jednostka}}</b>.</p>
<p>Organizatorem obozu jest <b>{{hufiec}}</b> działający w ramach Stowarzyszenia Harcerstwa Katolickiego „Zawisza" – Federacji Skautingu Europejskiego (Skauci Europy), reprezentowany przez kierownika wypoczynku <b>{{kierownik}}</b> (<b>{{tel_kierownik}}</b>). W obozie weźmie udział około <b>{{uczestnicy}}</b> uczestników w wieku <b>{{wiek}}</b> lat oraz <b>{{liczba_kadry}}</b> osób kadry wychowawczej. Uczestnikami będą {{CHOICE:plec:dziewczęta|chłopcy}} należący do {{CHOICE:galaz:gromad|drużyn}} Skautów Europy wraz z pełnoletnimi opiekunami.</p>
<p>Osoby wyznaczone do kontaktu ze służbami:</p>
<ul style="margin:6px 0 6px 22px;">
  <li>Kierownik: <b>{{kierownik}}</b>, tel. <b>{{tel_kierownik}}</b></li>
  <li>Wychowawca: <b>{{kontakt1}}</b>, tel. <b>{{tel_kontakt1}}</b></li>
  <li>Wychowawca: <b>{{kontakt2}}</b>, tel. <b>{{tel_kontakt2}}</b></li>
</ul>
<p>Uczestnicy oraz kadra zostaną zapoznani z zasadami bezpieczeństwa. Mapa terenu obozu w załączeniu.</p>
<div style="margin-top:40px;display:flex;justify-content:space-between;">
  <div><div style="border-top:1px solid #333;width:190px;padding-top:4px;text-align:center;">Podpis kierownika</div></div>
  <div><div style="border-top:1px solid #333;width:190px;padding-top:4px;text-align:center;">Pieczęć i podpis hufcowego</div></div>
</div>`,
  },

  przewodnie: {
    label: 'Pismo przewodnie (PSP)',
    icon: '🔥',
    attachments: [
      { id: 'kontakty',   label: 'Środki łączności',   icon: '📞', type: 'contacts' },
      { id: 'uczestnicy', label: 'Lista uczestników',   icon: '👥', type: 'participants' },
      { id: 'regulamin',  label: 'Regulamin obozu',     icon: '📋', type: 'placeholder' },
      { id: 'ppoz',       label: 'Instrukcja ppoż.',    icon: '🔥', type: 'placeholder' },
    ],
    html: `${SENDER}
<div style="margin-bottom:18px;">
  <p>Komenda {{CHOICE:psp_typ:Powiatowej|Miejskiej}} Straży Pożarnej</p>
  <p>w <b>{{powiat}}</b></p>
  <p>{{psp}}</p>
</div>
<p style="font-weight:bold;text-align:center;font-size:12pt;margin:18px 0 14px;">Wniosek o wydanie opinii w zakresie bezpieczeństwa przeciwpożarowego</p>
<p>Szanowni Państwo,</p>
<p>zwracam się z uprzejmą prośbą o wydanie opinii w zakresie bezpieczeństwa przeciwpożarowego dotyczącej organizacji obozu harcerskiego <b>{{jednostka}}</b>, planowanego w terminie od <b>{{date_start}}</b> do <b>{{date_end}}</b> na terenie Nadleśnictwa <b>{{nadlesnictwo}}</b>, w obrębie leśnictwa <b>{{lesnictwo}}</b> (oddział leśny nr <b>{{oddzial_lesny}}</b>).</p>
<p>Organizatorem obozu jest <b>{{hufiec}}</b>, działający w ramach Stowarzyszenia Harcerstwa Katolickiego „Zawisza" – Federacji Skautingu Europejskiego (Skauci Europy), reprezentowany przez kierownika wypoczynku <b>{{kierownik}}</b> (<b>{{tel_kierownik}}</b>). W obozie weźmie udział około <b>{{uczestnicy}}</b> uczestników w wieku <b>{{wiek}}</b> lat oraz <b>{{liczba_kadry}}</b> osób kadry wychowawczej. Uczestnikami będą {{CHOICE:plec:dziewczęta|chłopcy}} należący do {{CHOICE:galaz:gromad|drużyn}} Skautów Europy wraz z pełnoletnimi opiekunami.</p>
<p>Uczestnicy i kadra zostaną zapoznani z zasadami bezpieczeństwa p.poż. Osoby do kontaktu ze służbami:</p>
<ul style="margin:6px 0 6px 22px;">
  <li><b>{{kontakt1}}</b>, tel. <b>{{tel_kontakt1}}</b></li>
  <li><b>{{kontakt2}}</b>, tel. <b>{{tel_kontakt2}}</b></li>
</ul>
<p>W załączeniu przesyłam:</p>
<ul style="margin:6px 0 6px 22px;">
  <li>Środki łączności (📑OK.3.3)</li>
  <li>Lista uczestników (📑UC.3)</li>
  <li>Szkic zagospodarowania terenu (📑TR.4)</li>
  <li>Mapki ewakuacyjne (📑EW.2)</li>
  <li>Regulamin obozu (📑RG.1.1)</li>
  <li>Instrukcja ppoż. i ewakuacji (📑RG.2.1)</li>
</ul>
<div style="margin-top:40px;display:flex;justify-content:space-between;">
  <div><div style="border-top:1px solid #333;width:190px;padding-top:4px;text-align:center;">Podpis kierownika</div></div>
  <div><div style="border-top:1px solid #333;width:190px;padding-top:4px;text-align:center;">Pieczęć i podpis hufcowego</div></div>
</div>`,
  },

  wojt: {
    label: 'Pismo do Wójta',
    icon: '🏛️',
    html: `${SENDER}
<div style="margin-bottom:18px;">
  <p>Sz. P. Wójt / Burmistrz Gminy <b>{{gmina}}</b></p>
</div>
<p style="font-weight:bold;text-align:center;font-size:12pt;margin:18px 0 14px;">Wniosek o wyrażenie zgody na użytkowanie latryn oraz dołów chłonnych</p>
<p>Szanowny Panie Wójcie,</p>
<p>w związku z planowaną organizacją obozu harcerskiego na terenie Gminy <b>{{gmina}}</b>, w obrębie Nadleśnictwa <b>{{nadlesnictwo}}</b> (oddział leśny nr <b>{{oddzial_lesny}}</b>), zwracam się z uprzejmą prośbą o wyrażenie pisemnej zgody na wykopanie i użytkowanie latryn naturalnych oraz dołów chłonnych na czas trwania wypoczynku, tj. od <b>{{date_start}}</b> do <b>{{date_end}}</b>.</p>
<p>Organizatorem obozu jest <b>{{hufiec}}</b>, działający w ramach Stowarzyszenia Harcerstwa Katolickiego „Zawisza" – Federacji Skautingu Europejskiego (Skauci Europy), reprezentowany przez kierownika wypoczynku <b>{{kierownik}}</b> (<b>{{tel_kierownik}}</b>). W obozie weźmie udział około <b>{{uczestnicy}}</b> uczestników w wieku <b>{{wiek}}</b> lat oraz <b>{{liczba_kadry}}</b> osób kadry wychowawczej. Uczestnikami będą {{CHOICE:plec:dziewczęta|chłopcy}} należący do {{CHOICE:galaz:gromad|drużyn}} Skautów Europy.</p>
<p>Obóz organizowany jest za zgodą Nadleśnictwa <b>{{nadlesnictwo}}</b>. Latryny i doły chłonne zostaną wykonane zgodnie z normami i zasypane po zakończeniu obozu.</p>
<div style="margin-top:40px;display:flex;justify-content:space-between;">
  <div><div style="border-top:1px solid #333;width:190px;padding-top:4px;text-align:center;">Podpis kierownika</div></div>
  <div><div style="border-top:1px solid #333;width:190px;padding-top:4px;text-align:center;">Pieczęć i podpis hufcowego</div></div>
</div>`,
  },

  nadlesnictwo: {
    label: 'Wniosek do Nadleśnictwa',
    icon: '🌲',
    html: `${SENDER}
<div style="margin-bottom:18px;">
  <p>Nadleśnictwo <b>{{nadlesnictwo}}</b></p>
</div>
<p style="font-weight:bold;text-align:center;font-size:12pt;margin:18px 0 14px;">Wniosek o udostępnienie terenu leśnego w celu organizacji obozu harcerskiego</p>
<p>Szanowni Państwo,</p>
<p>zwracam się z uprzejmą prośbą o udostępnienie terenu leśnego w obrębie Nadleśnictwa <b>{{nadlesnictwo}}</b>, leśnictwa <b>{{lesnictwo}}</b> (oddział leśny nr <b>{{oddzial_lesny}}</b>), w celu organizacji obozu harcerskiego <b>{{jednostka}}</b> w terminie od <b>{{date_start}}</b> do <b>{{date_end}}</b>.</p>
<p>Organizatorem obozu jest <b>{{hufiec}}</b>, działający w ramach Stowarzyszenia Harcerstwa Katolickiego „Zawisza" – Federacji Skautingu Europejskiego (Skauci Europy), reprezentowany przez kierownika wypoczynku <b>{{kierownik}}</b> (<b>{{tel_kierownik}}</b>).</p>
<p>W obozie weźmie udział około <b>{{uczestnicy}}</b> uczestników w wieku <b>{{wiek}}</b> lat oraz <b>{{liczba_kadry}}</b> osób kadry wychowawczej. Uczestnikami będą {{CHOICE:plec:dziewczęta|chłopcy}} należący do {{CHOICE:galaz:gromad|drużyn}} Skautów Europy.</p>
<p>Zobowiązujemy się do przestrzegania przepisów o ochronie lasu, utrzymania czystości oraz przywrócenia terenu do stanu pierwotnego po zakończeniu obozu.</p>
<div style="margin-top:40px;display:flex;justify-content:space-between;">
  <div><div style="border-top:1px solid #333;width:190px;padding-top:4px;text-align:center;">Podpis kierownika</div></div>
  <div><div style="border-top:1px solid #333;width:190px;padding-top:4px;text-align:center;">Pieczęć i podpis hufcowego</div></div>
</div>`,
  },

  oswiadczenie: {
    label: 'Oświadczenie właściciela',
    icon: '📝',
    html: `
<div style="text-align:right;margin-bottom:22px;">{{miejsce}}, dnia {{data_dzis}}</div>
<p style="font-weight:bold;text-align:center;font-size:13pt;margin:0 0 6px;">OŚWIADCZENIE WŁAŚCICIELA TERENU</p>
<p style="text-align:center;margin-bottom:22px;">o wyrażeniu zgody na organizację obozu harcerskiego</p>
<p>Ja, niżej {{CHOICE:podp:podpisany|podpisana}} ................................................................., {{CHOICE:zamiesz:zamieszkały|zamieszkała}} w ................................................................., legitymujący się dowodem osobistym nr .................................................................,</p>
<p style="font-weight:bold;margin-top:12px;">oświadczam, że wyrażam zgodę na:</p>
<ol style="margin:8px 0 8px 22px;">
  <li>Rozbicie obozu harcerskiego na terenie działki nr <b>{{nr_dzialki}}</b> w miejscowości <b>{{miejsce}}</b>,</li>
  <li>Korzystanie z terenu przez jednostkę <b>{{jednostka}}</b> w terminie od <b>{{date_start}}</b> do <b>{{date_end}}</b>,</li>
  <li>Użytkowanie istniejącej infrastruktury (..................).</li>
</ol>
<p>W obozie weźmie udział ok. <b>{{uczestnicy}}</b> osób, w tym kierownik oraz <b>{{liczba_kadry}}</b> wychowawców. Uczestnicy są w wieku <b>{{wiek}}</b> lat.</p>
<p>Zgoda obejmuje w szczególności kopanie dołów chłonnych i latryn, rozpalanie ognisk w wyznaczonych miejscach, postawienie beczkowozu z wodą oraz składowanie odpadów w wydzielonym miejscu.</p>
<p>Organizator zobowiązuje się do przywrócenia terenu do stanu pierwotnego po zakończeniu obozu.</p>
<p style="margin-top:14px;"><b>Dane kontaktowe kierownika obozu:</b></p>
<p>Imię i nazwisko: <b>{{kierownik}}</b></p>
<p>Nr telefonu: <b>{{tel_kierownik}}</b> &nbsp;&nbsp; E-mail: <b>{{email}}</b></p>
<div style="margin-top:40px;display:flex;justify-content:space-between;">
  <div><div style="border-top:1px solid #333;width:190px;padding-top:4px;text-align:center;">Podpis właściciela</div></div>
  <div><div style="border-top:1px solid #333;width:190px;padding-top:4px;text-align:center;">Podpis kierownika</div></div>
</div>`,
  },

  schronienie: {
    label: 'Umowa tymcz. schronienie',
    icon: '🏠',
    html: `
<p style="font-weight:bold;text-align:center;font-size:12pt;margin:0 0 6px;">Umowa na korzystanie z budynku jako miejsca tymczasowego schronienia</p>
<p style="text-align:center;margin-bottom:18px;font-size:10pt;">w czasie niesprzyjających warunków pogodowych dla uczestników obozu harcerskiego</p>
<p>Zawarta w dniu <b>{{data_dzis}}</b> pomiędzy:</p>
<p><b>{{bezp_budynek}}</b> reprezentowaną przez ............................................., zwanego dalej „Użyczający",</p>
<p>a Stowarzyszeniem Harcerstwa Katolickiego „Zawisza" Federacja Skautingu Europejskiego, reprezentowanym przez <b>{{kierownik}}</b>, zwanym dalej „Korzystającym".</p>
<p style="font-weight:bold;margin-top:14px;">§1.</p>
<p>Użyczający oświadcza, że zarządza budynkiem w <b>{{bezp_miejscowosc}}</b> (adres: <b>{{bezp_adres}}</b>) i deklaruje, że udostępni Korzystającemu Budynek (dla około <b>{{uczestnicy}}</b> osób) w dniach od <b>{{date_start}}</b> do <b>{{date_end}}</b> w razie niesprzyjających warunków pogodowych.</p>
<p style="font-weight:bold;margin-top:12px;">§2.</p>
<p>Użyczający oddaje Korzystającemu do korzystania Budynek, a w szczególności: sale, zaplecze sanitarne oraz pomieszczenia umożliwiające przygotowanie posiłków.</p>
<p style="font-weight:bold;margin-top:12px;">§3.</p>
<p>Korzystający zobowiązuje się do przestrzegania regulaminów, utrzymania porządku oraz pokrycia ewentualnych kosztów wynikłych z użytkowania obiektu.</p>
<p style="font-weight:bold;margin-top:12px;">§4.</p>
<p>Umowa obowiązuje w czasie trwania obozu harcerskiego <b>{{jednostka}}</b> organizowanego przez <b>{{hufiec}}</b>.</p>
<div style="margin-top:40px;display:flex;justify-content:space-between;">
  <div><div style="border-top:1px solid #333;width:190px;padding-top:4px;text-align:center;">Użyczający</div></div>
  <div><div style="border-top:1px solid #333;width:190px;padding-top:4px;text-align:center;">Korzystający (Kierownik)</div></div>
</div>`,
  },

  pojazd: {
    label: 'Umowa użyczenia pojazdu',
    icon: '🚗',
    html: `
<p style="font-weight:bold;text-align:center;font-size:13pt;margin:0 0 6px;">UMOWA BEZPŁATNEGO UŻYCZENIA SAMOCHODU</p>
<p style="text-align:center;margin-bottom:18px;">Zawarta dnia: <b>{{data_dzis}}</b> w <b>{{miejsce}}</b></p>
<p>pomiędzy: ......................................................, zwanym dalej Użyczającym</p>
<p>oraz: <b>{{hufiec}}</b>, Stowarzyszenie Harcerstwa Katolickiego „Zawisza", zwanym dalej Biorącym.</p>
<p style="font-weight:bold;margin-top:14px;">§1</p>
<p>1. Użyczający użycza Biorącemu samochód marki: ..............., koloru ..............., nr rejestracyjny: ..............., rok produkcji: ..............., którego jest właścicielem.</p>
<p>2. Użyczający oświadcza, że samochód jest sprawny, posiada ubezpieczenie OC oraz ważny przegląd techniczny.</p>
<p style="font-weight:bold;margin-top:12px;">§2</p>
<p>Wszelkie zmiany umowy mogą nastąpić tylko w formie pisemnej pod rygorem nieważności.</p>
<p style="font-weight:bold;margin-top:12px;">§3</p>
<p>Użyczający wyraża zgodę na używanie samochodu w ramach działalności statutowej — organizacji obozu harcerskiego <b>{{jednostka}}</b> w terminie od <b>{{date_start}}</b> do <b>{{date_end}}</b>.</p>
<p style="font-weight:bold;margin-top:12px;">§4</p>
<p>Biorący zobowiązuje się nie oddawać pojazdu osobom trzecim oraz pokrywać koszty eksploatacji.</p>
<p style="font-weight:bold;margin-top:12px;">§5</p>
<p>Umowa obowiązuje od <b>{{date_start}}</b> do <b>{{date_end}}</b>.</p>
<div style="margin-top:40px;display:flex;justify-content:space-between;">
  <div><div style="border-top:1px solid #333;width:190px;padding-top:4px;text-align:center;">Użyczający</div></div>
  <div><div style="border-top:1px solid #333;width:190px;padding-top:4px;text-align:center;">Biorący (Kierownik)</div></div>
</div>`,
  },

  szkola: {
    label: 'Wniosek o pomieszczenia szkolne',
    icon: '🏫',
    html: `${SENDER}
<div style="margin-bottom:18px;">
  <p>Sz. P. .......................................</p>
  <p>Dyrektor .......................................................................................................</p>
</div>
<p style="font-weight:bold;text-align:center;font-size:12pt;margin:18px 0 14px;">Wniosek o udostępnienie pomieszczeń szkolnych</p>
<p>Szanowny Panie Dyrektorze,</p>
<p>zwracam się z uprzejmą prośbą o wyrażenie zgody na udostępnienie pomieszczeń szkoły w celu organizacji {{CHOICE:typ:biwaku|zimowiska}} harcerskiego.</p>
<p>Wyjazd planowany jest w terminie od <b>{{date_start}}</b> do <b>{{date_end}}</b>. Organizatorem jest <b>{{jednostka}}</b> działająca w ramach Stowarzyszenia Harcerstwa Katolickiego „Zawisza" – Federacji Skautingu Europejskiego (Skauci Europy).</p>
<p>W wydarzeniu weźmie udział około <b>{{uczestnicy}}</b> uczestników w wieku <b>{{wiek}}</b> lat oraz <b>{{liczba_kadry}}</b> pełnoletnich opiekunów.</p>
<p>Zwracamy się o możliwość korzystania z: sal lekcyjnych (nocleg), sali gimnastycznej, zaplecza sanitarnego oraz kuchni/stołówki.</p>
<p>Zobowiązujemy się do przestrzegania regulaminów szkoły, zapewnienia całodobowej opieki, pokrycia ewentualnych kosztów oraz przywrócenia pomieszczeń do stanu pierwotnego.</p>
<div style="margin-top:40px;display:flex;justify-content:space-between;">
  <div><div style="border-top:1px solid #333;width:190px;padding-top:4px;text-align:center;">Podpis kierownika</div></div>
  <div><div style="border-top:1px solid #333;width:190px;padding-top:4px;text-align:center;">Pieczęć i podpis hufcowego</div></div>
</div>`,
  },

  kontaktowa: {
    label: 'Lista kontaktowa',
    icon: '📞',
    html: `
<p style="font-weight:bold;text-align:center;font-size:14pt;margin:0 0 4px;">LISTA KONTAKTOWA OBOZU</p>
<p style="text-align:center;margin-bottom:14px;color:#555;">{{jednostka}} · {{date_start}} – {{date_end}} · {{miejsce}}</p>

<table style="width:100%;border-collapse:collapse;font-size:10pt;margin-bottom:14px;">
  <tr style="background:#2d6a2d;color:#fff;"><th style="padding:6px 8px;text-align:left;" colspan="2">KIEROWNICTWO OBOZU</th></tr>
  <tr style="border-bottom:1px solid #ddd;"><td style="padding:5px 8px;width:38%;">Kierownik obozu</td><td style="padding:5px 8px;"><b>{{kierownik}}</b> · {{tel_kierownik}}</td></tr>
  <tr style="border-bottom:1px solid #ddd;"><td style="padding:5px 8px;">Wychowawca</td><td style="padding:5px 8px;"><b>{{kontakt1}}</b> · {{tel_kontakt1}}</td></tr>
  <tr><td style="padding:5px 8px;">Wychowawca</td><td style="padding:5px 8px;"><b>{{kontakt2}}</b> · {{tel_kontakt2}}</td></tr>
</table>

<table style="width:100%;border-collapse:collapse;font-size:10pt;margin-bottom:14px;">
  <tr style="background:#2d6a2d;color:#fff;"><th style="padding:6px 8px;text-align:left;" colspan="2">KONTAKTY ALARMOWE</th></tr>
  <tr style="border-bottom:1px solid #ddd;"><td style="padding:5px 8px;width:38%;">Pogotowie / Alarmowy</td><td style="padding:5px 8px;"><b>999 / 112</b></td></tr>
  <tr style="border-bottom:1px solid #ddd;"><td style="padding:5px 8px;">Straż Pożarna</td><td style="padding:5px 8px;"><b>998</b> · {{psp}}</td></tr>
  <tr style="border-bottom:1px solid #ddd;"><td style="padding:5px 8px;">Policja</td><td style="padding:5px 8px;"><b>997</b> · {{policja}}</td></tr>
  <tr><td style="padding:5px 8px;">Szpital / Przychodnia</td><td style="padding:5px 8px;">{{szpital}}</td></tr>
</table>

<table style="width:100%;border-collapse:collapse;font-size:10pt;margin-bottom:14px;">
  <tr style="background:#2d6a2d;color:#fff;"><th style="padding:6px 8px;text-align:left;" colspan="3">STOWARZYSZENIE — KONTAKTY CENTRALNE</th></tr>
  <tr style="border-bottom:1px solid #ddd;"><td style="padding:5px 8px;">Biuro Stowarzyszenia</td><td style="padding:5px 8px;">22 822 32 29 / 668 415 726</td><td style="padding:5px 8px;color:#666;">biuro@skauci-europy.pl</td></tr>
  <tr style="border-bottom:1px solid #ddd;"><td style="padding:5px 8px;">Ochrona Dzieci i Młodzieży</td><td style="padding:5px 8px;">731 988 833</td><td style="padding:5px 8px;color:#666;">ochrona.dim@skauci-europy.pl</td></tr>
  <tr style="border-bottom:1px solid #ddd;"><td style="padding:5px 8px;">Psycholog</td><td style="padding:5px 8px;">730 988 833</td><td style="padding:5px 8px;color:#666;">wsparcie.psychologiczne@skauci-europy.pl</td></tr>
  <tr><td style="padding:5px 8px;">Szef Kursu (Wypoczynek)</td><td style="padding:5px 8px;">508 510 456</td><td style="padding:5px 8px;color:#666;">wypoczynek@skauci-europy.edu.pl</td></tr>
</table>

<table style="width:100%;border-collapse:collapse;font-size:10pt;">
  <tr style="background:#2d6a2d;color:#fff;"><th style="padding:6px 8px;text-align:left;" colspan="2">HUFIEC: {{hufiec}}</th></tr>
  <tr style="border-bottom:1px solid #ddd;"><td style="padding:5px 8px;width:38%;">Hufcowa/y</td><td style="padding:5px 8px;">.................................</td></tr>
  <tr style="border-bottom:1px solid #ddd;"><td style="padding:5px 8px;">Z-ca Hufcowej/go</td><td style="padding:5px 8px;">.................................</td></tr>
  <tr><td style="padding:5px 8px;">Asystent/ka ds. wypoczynku</td><td style="padding:5px 8px;">.................................</td></tr>
</table>`,
  },
}
