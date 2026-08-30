# Korrektur Wrapper

Lokale Software zur KI-gestützten Korrektur literarischer Texte. Die Autorin bedient sie selbst.

## Für wen

Eine Autorin schreibt lange Bücher (ca. 400 Seiten) in Microsoft Word (`docx`), oft per Diktierfunktion. Ein Kapitel sind typischerweise 20–30 Seiten. Word- und Google-Rechtschreibung scheitern an literarischem Stil, Wortneuschöpfungen, Namen und Wörtern anderer Sprachen.

Die App läuft auf ihrem Windows-Rechner. Entwickelt wird auf einem anderen Rechner, ebenfalls mit Word — aber **ohne ihre Manuskripte**. Testdateien legen wir selbst an (Formatierung, Diktierfehler, erfundene Wörter). Echte Buchdateien kommen nicht ins Git.

## Ziel

Ein Kapitel als Word-Datei öffnen. Die KI markiert mögliche Fehler eher zu viel als zu wenig: ein Extra-Klick auf „Kein Fehler“ ist besser als ein übersehener Fehler im Buch. Pro Fundstelle:

1. eine von drei kontextbezogenen Korrekturvorschlägen wählen,
2. ein eigenes Wort eingeben, oder
3. „Das ist kein Fehler“ markieren.

Danach lokal speichern. Das Original wird nicht still überschrieben.

Die KI ist Lektorin, kein Duden: Vorschläge aus dem literarischen Kontext, inklusive seltener Begriffe und gelegentlicher anderer Sprachen. Sie darf den Stil nicht glätten und Sätze nicht umschreiben — nur die markierte Stelle.

## Form

Lokale Web-App (Lesezeichen auf dem Entwicklungsrechner). Auf ihrem PC später derselbe Stand als Desktop-Verknüpfung ins Edge-Fenster, ohne Browser-Leiste. Dateien werden im `docx`-XML bearbeitet (nur die betroffene Textstelle), die Formatierung bleibt 1:1. Word dient zum Anlegen und Sichtprüfen der Testdateien, nicht als Teil der App.

## Starten

```bash
npm install
npm run dev
```

Im Browser die angezeigte Adresse als Lesezeichen speichern (meist `http://localhost:5173`). Testdatei: `test_material/Novemberlicht.docx`.

Den API-Schlüssel oben auf der Seite speichern (Bearbeiten / Speichern). Er bleibt im Browser und kommt nicht ins Git. Alternativ geht weiterhin `.env`.
