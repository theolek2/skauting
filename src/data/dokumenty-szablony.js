export const DOC_TEMPLATES = {
  kontaktowa: {
    label: 'Lista kontaktowa',
    icon: '\uD83D\uDCDE',
    html: `
<p style="text-align:center;font-size:14pt;font-weight:bold;">LISTA KONTAKTOWA</p>
<p style="text-align:center;margin-bottom:20px;">OB\u00d3Z HARCERSKI</p>
<table style="width:100%;border-collapse:collapse;font-size:10pt;">
  <tr><td style="padding:4px 0;"><b>Jednostka:</b> {{jednostka}}</td></tr>
  <tr><td style="padding:4px 0;"><b>Kierownik obozu:</b> {{kierownik}}</td></tr>
  <tr><td style="padding:4px 0;"><b>Telefon kierownika:</b> {{tel_kierownik}}</td></tr>
  <tr><td style="padding:4px 0;"><b>Miejsce obozu:</b> {{miejsce}}</td></tr>
  <tr><td style="padding:4px 0;"><b>Termin:</b> {{termin}}</td></tr>
  <tr><td style="padding:4px 0;"><b>Liczba uczestnik\u00f3w:</b> {{uczestnicy}}</td></tr>
</table>
<p style="margin-top:16px;"><b>Wychowawcy:</b></p>
{{wychowawcy_list}}
<p style="margin-top:16px;"><b>Kontakty alarmowe:</b></p>
<p>Szpital: {{szpital}} &mdash; tel. {{tel_szpital}}</p>
<p>Policja/Stra\u017c: {{tel_alarmowy}}</p>
<p>Lekarz obozowy: {{lekarz}}</p>
`
  },

  oswiadczenie: {
    label: 'O\u015bwiadczenie w\u0142a\u015bciciela',
    icon: '\uD83D\uDCDD',
    html: `
<p style="text-align:right;">{{miejsce}}, dnia ............</p>
<p style="font-size:12pt;font-weight:bold;text-align:center;margin:20px 0;">O\u015aWIADCZENIE</p>
<p>Ja, ni\u017cej podpisany/a ............................................., zamieszka\u0142y/a w ............................................., legitymuj\u0105cy/a si\u0119 dowodem osobistym nr .............................................,</p>
<p style="font-weight:bold;margin-top:14px;">o\u015bwiadczam, \u017ce wyra\u017cam zgod\u0119 na:</p>
<p>1. Rozbicie obozu harcerskiego na terenie dzia\u0142ki nr ........ w miejscowo\u015bci {{miejsce}},</p>
<p>2. Korzystanie z terenu przez jednostk\u0119 {{jednostka}} w terminie {{termin}},</p>
<p>3. U\u017cytkowanie istniej\u0105cej infrastruktury (..............).</p>
<p style="margin-top:20px;">Organizator zobowi\u0105zuje si\u0119 do przywr\u00f3cenia terenu do stanu pierwotnego po zako\u0144czeniu obozu.</p>
<p style="margin-top:30px;display:flex;justify-content:space-between;">
  <span>.............................................<br><small>(podpis w\u0142a\u015bciciela)</small></span>
  <span>.............................................<br><small>(podpis kierownika)</small></span>
</p>
`
  },

  wojt: {
    label: 'Pismo do W\u00f3jta',
    icon: '\uD83C\uDFDB\uFE0F',
    html: `
<p style="text-align:right;">{{miejsce}}, dnia ............</p>
<p style="margin-bottom:4px;"><b>Do:</b></p>
<p>W\u00f3jt Gminy .................................</p>
<p>ul. .............................................</p>
<p>.............. .................................</p>
<p style="margin-top:20px;font-weight:bold;">Dotyczy: zg\u0142oszenia obozu harcerskiego</p>
<p style="margin-top:14px;">Szanowny Panie W\u00f3jcie,</p>
<p>Niniejszym zg\u0142aszam organizacj\u0119 obozu harcerskiego przez jednostk\u0119 <b>{{jednostka}}</b>, kt\u00f3ry odb\u0119dzie si\u0119 w miejscowo\u015bci <b>{{miejsce}}</b> w terminie <b>{{termin}}</b>.</p>
<p>Kierownikiem obozu jest <b>{{kierownik}}</b>, tel. <b>{{tel_kierownik}}</b>.</p>
<p>W obozie we\u017amie udzia\u0142 oko\u0142o <b>{{uczestnicy}}</b> uczestnik\u00f3w. Kadr\u0119 stanowi\u0105 wykwalifikowani wychowawcy z uprawnieniami.</p>
<p>Prosz\u0119 o przyj\u0119cie zg\u0142oszenia do wiadomo\u015bci.</p>
<p style="margin-top:30px;display:flex;justify-content:space-between;">
  <span>.............................................<br><small>(piecz\u0119\u0107 jednostki)</small></span>
  <span>.............................................<br><small>(podpis kierownika)</small></span>
</p>
`
  },

  przewodnie: {
    label: 'Pismo przewodnie',
    icon: '\uD83D\uDCCB',
    html: `
<p style="text-align:right;">{{miejsce}}, dnia ............</p>
<p style="margin-bottom:4px;"><b>Do:</b></p>
<p>Kuratorium O\u015bwiaty w .................................</p>
<p>Wydzia\u0142 ...............................................</p>
<p>ul. .............................................</p>
<p style="margin-top:20px;font-weight:bold;">Dotyczy: zg\u0142oszenia wypoczynku dzieci i m\u0142odzie\u017cy</p>
<p style="margin-top:14px;">Szanowni Pa\u0144stwo,</p>
<p>W za\u0142\u0105czeniu przesy\u0142am dokumentacj\u0119 zg\u0142oszeniow\u0105 obozu harcerskiego organizowanego przez <b>{{jednostka}}</b>.</p>
<p><b>Termin:</b> {{termin}}</p>
<p><b>Miejsce:</b> {{miejsce}}</p>
<p><b>Kierownik:</b> {{kierownik}}, tel. {{tel_kierownik}}</p>
<p><b>Liczba uczestnik\u00f3w:</b> {{uczestnicy}}</p>
<p><b>Kategoria wiekowa:</b> {{wiek}}</p>
<p style="margin-top:14px;">Za\u0142\u0105czniki:</p>
<ol>
  <li>Karta zg\u0142oszenia wypoczynku</li>
  <li>Ramowy plan pracy (w za\u0142\u0105czeniu)</li>
  <li>Lista uczestnik\u00f3w</li>
  <li>O\u015bwiadczenia wychowawc\u00f3w</li>
  <li>Za\u015bwiadczenia z KRK</li>
</ol>
<p style="margin-top:30px;display:flex;justify-content:space-between;">
  <span>.............................................<br><small>(piecz\u0119\u0107 jednostki)</small></span>
  <span>.............................................<br><small>(podpis kierownika)</small></span>
</p>
`
  },

  pojazd: {
    label: 'Umowa u\u017cyczenia pojazdu',
    icon: '\uD83D\uDE90',
    html: `
<p style="text-align:center;font-size:14pt;font-weight:bold;">UMOWA BEZP\u0141ATNEGO U\u017bYCZENIA POJAZDU</p>
<p style="text-align:center;margin-bottom:20px;">(u\u017cyczenie nieodp\u0142atne)</p>
<p>Zawarta w dniu ............ w miejscowo\u015bci .....................................</p>
<p style="margin-top:14px;"><b>U\u017cyczaj\u0105cy:</b></p>
<p>Imi\u0119 i nazwisko: ...............................................................</p>
<p>Adres: ..............................................................................</p>
<p>Dow\u00f3d osobisty nr: ............................................................</p>
<p>Nr rejestracyjny pojazdu: ......................................................</p>
<p>Marka i model: ...................................................................</p>
<p style="margin-top:14px;"><b>Bior\u0105cy w u\u017cyczenie:</b></p>
<p>{{jednostka}}, reprezentowana przez {{kierownik}}</p>
<p><b>Cel:</b> transport uczestnik\u00f3w i sprz\u0119tu na ob\u00f3z harcerski w miejscowo\u015bci {{miejsce}} w terminie {{termin}}.</p>
<p>Umowa zostaje zawarta na czas trwania obozu. Bior\u0105cy zobowi\u0105zuje si\u0119 do zwrotu pojazdu w stanie niepogorszonym.</p>
<p style="margin-top:30px;display:flex;justify-content:space-between;">
  <span>.............................................<br><small>(podpis u\u017cyczaj\u0105cego)</small></span>
  <span>.............................................<br><small>(podpis bior\u0105cego)</small></span>
</p>
`
  },

  schronienie: {
    label: 'Umowa tymcz. schronienie',
    icon: '\uD83C\uDFE0',
    html: `
<p style="text-align:center;font-size:14pt;font-weight:bold;">UMOWA TYMCZASOWEGO UDOST\u0118PNIENIA POMIESZCZENIA</p>
<p style="text-align:center;margin-bottom:20px;">(schronienie awaryjne)</p>
<p>Zawarta w dniu ............ w .....................................</p>
<p style="margin-top:14px;"><b>Udost\u0119pniaj\u0105cy:</b></p>
<p>Imi\u0119 i nazwisko / nazwa: .....................................................</p>
<p>Adres nieruchomo\u015bci: ..........................................................</p>
<p style="margin-top:14px;"><b>Bior\u0105cy:</b></p>
<p>{{jednostka}}, reprezentowana przez {{kierownik}}, tel. {{tel_kierownik}}</p>
<p style="margin-top:14px;">Udost\u0119pniaj\u0105cy oddaje w tymczasowe bezp\u0142atne u\u017cytkowanie pomieszczenie w budynku po\u0142o\u017conym w ............................................. na wypadek konieczno\u015bci ewakuacji uczestnik\u00f3w obozu harcerskiego w {{miejsce}} w terminie {{termin}}.</p>
<p>Umowa obowi\u0105zuje w dniach {{termin}}.</p>
<p style="margin-top:30px;display:flex;justify-content:space-between;">
  <span>.............................................<br><small>(podpis udost\u0119pniaj\u0105cego)</small></span>
  <span>.............................................<br><small>(podpis kierownika)</small></span>
</p>
`
  },

  nadlesnictwo: {
    label: 'Wniosek do Nadle\u015bnictwa',
    icon: '\uD83C\uDF32',
    html: `
<p style="text-align:right;">{{miejsce}}, dnia ............</p>
<p style="margin-bottom:4px;"><b>Do:</b></p>
<p>Nadle\u015bnictwo .......................................</p>
<p>ul. .............................................</p>
<p style="margin-top:20px;font-weight:bold;">Wniosek o zgod\u0119 na biwakowanie na terenie le\u015bnym</p>
<p style="margin-top:14px;">Szanowni Pa\u0144stwo,</p>
<p>Zwracam si\u0119 z uprzejm\u0105 pro\u015bb\u0105 o wydanie zgody na biwakowanie na terenie podle-gaj\u0105cym Nadle\u015bnictwu ....................................... w zwi\u0105zku z organizacj\u0105 obozu harcerskiego.</p>
<p><b>Organizator:</b> {{jednostka}}</p>
<p><b>Kierownik:</b> {{kierownik}}, tel. {{tel_kierownik}}</p>
<p><b>Miejsce:</b> {{miejsce}} (dzia\u0142ka nr ........, oddzia\u0142 ........)</p>
<p><b>Termin:</b> {{termin}}</p>
<p><b>Liczba uczestnik\u00f3w:</b> {{uczestnicy}}</p>
<p>Zobowi\u0105zujemy si\u0119 do przestrzegania przepis\u00f3w przeciwpo\u017carowych, nieza\u015bmie-cania terenu oraz przywr\u00f3cenia go do stanu pierwotnego.</p>
<p style="margin-top:30px;display:flex;justify-content:space-between;">
  <span>.............................................<br><small>(piecz\u0119\u0107 jednostki)</small></span>
  <span>.............................................<br><small>(podpis kierownika)</small></span>
</p>
`
  },

  szkola: {
    label: 'Udost\u0119pnienie pom. szkolnych',
    icon: '\uD83C\uDFEB',
    html: `
<p style="text-align:right;">{{miejsce}}, dnia ............</p>
<p style="margin-bottom:4px;"><b>Do:</b></p>
<p>Dyrektor Szko\u0142y Podstawowej w .........................</p>
<p>ul. .............................................</p>
<p style="margin-top:20px;font-weight:bold;">Wniosek o udost\u0119pnienie pomieszcze\u0144 szkolnych</p>
<p style="margin-top:14px;">Szanowny Panie Dyrektorze,</p>
<p>W imieniu jednostki <b>{{jednostka}}</b> zwracam si\u0119 z uprzejm\u0105 pro\u015bb\u0105 o udost\u0119pnienie pomieszcze\u0144 szkolnych (sala gimnastyczna / \u015bwietlica / sanitariaty) w dniach <b>{{termin}}</b> w zwi\u0105zku z organizacj\u0105 obozu harcerskiego w pobliskiej miejscowo\u015bci {{miejsce}}.</p>
<p>Pomieszczenia by\u0142yby wykorzystywane wy\u0142\u0105cznie w przypadku wyst\u0105pienia nie-sprzyjaj\u0105cych warunk\u00f3w atmosferycznych (ewakuacja, schronienie).</p>
<p>Kierownikiem obozu jest <b>{{kierownik}}</b>, tel. <b>{{tel_kierownik}}</b>.</p>
<p>Zobowi\u0105zujemy si\u0119 do pozostawienia pomieszcze\u0144 w stanie nienaruszonym.</p>
<p style="margin-top:30px;display:flex;justify-content:space-between;">
  <span>.............................................<br><small>(piecz\u0119\u0107 jednostki)</small></span>
  <span>.............................................<br><small>(podpis kierownika)</small></span>
</p>
`
  },

  zawiadomienie: {
    label: 'Zawiadomienie o obozie',
    icon: '\uD83D\uDCE8',
    html: `
<p style="text-align:right;">{{miejsce}}, dnia ............</p>
<p style="margin-bottom:4px;"><b>Do:</b></p>
<p>Komenda Powiatowa Policji w .........................</p>
<p style="margin-top:20px;font-weight:bold;">Zawiadomienie o organizacji obozu harcerskiego</p>
<p style="margin-top:14px;">Szanowni Pa\u0144stwo,</p>
<p>Niniejszym zawiadamiam o organizacji obozu harcerskiego dla dzieci i m\u0142odzie\u017cy.</p>
<p><b>Organizator:</b> {{jednostka}}</p>
<p><b>Kierownik:</b> {{kierownik}}, tel. {{tel_kierownik}}</p>
<p><b>Miejsce obozu:</b> {{miejsce}}</p>
<p><b>Termin:</b> {{termin}}</p>
<p><b>Liczba uczestnik\u00f3w:</b> {{uczestnicy}}</p>
<p><b>Wiek uczestnik\u00f3w:</b> {{wiek}}</p>
<p>W za\u0142\u0105czeniu przekazuj\u0119 list\u0119 kontaktow\u0105 kadry oraz plan terenu obozu.</p>
<p style="margin-top:30px;display:flex;justify-content:space-between;">
  <span>.............................................<br><small>(piecz\u0119\u0107 jednostki)</small></span>
  <span>.............................................<br><small>(podpis kierownika)</small></span>
</p>
`
  },
}
