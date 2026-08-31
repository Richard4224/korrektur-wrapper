# Korrektur Wrapper

Software zur KI-gestützten Korrektur literarischer Texte. Die Autorin bedient sie selbst.

Jeder bringt einen **eigenen OpenAI-API-Schlüssel** mit. Es wird kein Schlüssel geteilt.

## Öffentlich

Die App liegt auf Cloudflare Pages: **https://korrektur-wrapper.pages.dev/**

Impressum, Datenschutz sowie Nutzung und Kosten sind in der App verlinkt.

Lokal entwickeln:

```bash
npm install
npm run dev
```

Im Browser meist `http://localhost:5173`. Testdatei: `test_material/Novemberlicht.docx`. Den API-Schlüssel oben auf der Seite speichern — er bleibt in diesem Browser.

## Für wen

Eine Autorin schreibt lange Bücher (ca. 400 Seiten) in Microsoft Word (`docx`), oft per Diktierfunktion. Ein Kapitel sind typischerweise 20–30 Seiten. Word- und Google-Rechtschreibung scheitern an literarischem Stil, Wortneuschöpfungen, Namen und Wörtern anderer Sprachen.

Echte Buchdateien kommen nicht ins Git. Testdateien legen wir selbst an.

## Ziel

Ein Kapitel als Word-Datei öffnen. Die KI markiert mögliche Fehler eher zu viel als zu wenig. Pro Fundstelle eine von drei Vorschlägen wählen, ein eigenes Wort eingeben, „Kein Fehler“ oder überspringen. Danach lokal speichern. Das Original wird nicht still überschrieben.

Die KI ist Lektorin, kein Duden: keine Satzumschriften, nur die markierte Stelle. Sie kann Fehler machen und Stellen übersehen.

## Technik

Dateien werden im `docx`-XML bearbeitet (nur betroffene `w:t`-Knoten). Die Prüfung läuft über OpenAI; Kosten entstehen beim Konto hinter dem jeweiligen Schlüssel.
