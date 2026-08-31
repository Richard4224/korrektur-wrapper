import { useEffect, useState } from "react";
import {
  LEGAL_STAND,
  OPERATOR_EMAIL,
  OPERATOR_NAME,
  legalPageFromHash,
  type LegalPage,
} from "./legal";

const TITLES: Record<LegalPage, string> = {
  impressum: "Impressum",
  datenschutz: "Datenschutz",
  nutzung: "Nutzung und Kosten",
};

export function useLegalPage(): LegalPage | null {
  const [page, setPage] = useState<LegalPage | null>(() =>
    legalPageFromHash(window.location.hash),
  );
  useEffect(() => {
    function sync() {
      setPage(legalPageFromHash(window.location.hash));
    }
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);
  useEffect(() => {
    document.title = page
      ? `${TITLES[page]} · Korrektur Wrapper`
      : "Korrektur Wrapper";
  }, [page]);
  return page;
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <a className="footer-link" href="#nutzung">
        Nutzung und Kosten
      </a>
      <a className="footer-link" href="#datenschutz">
        Datenschutz
      </a>
      <a className="footer-link" href="#impressum">
        Impressum
      </a>
    </footer>
  );
}

export function LegalPages({ page }: { page: LegalPage }) {
  return (
    <article className="legal">
      <p className="legal-back">
        <a className="btn" href="#">
          Zurück zur App
        </a>
      </p>
      {page === "impressum" && <Impressum />}
      {page === "datenschutz" && <Datenschutz />}
      {page === "nutzung" && <Nutzung />}
      <p className="legal-stand">Stand: {LEGAL_STAND}</p>
    </article>
  );
}

function Mail() {
  return <a href={`mailto:${OPERATOR_EMAIL}`}>{OPERATOR_EMAIL}</a>;
}

function Impressum() {
  return (
    <>
      <h1>Impressum</h1>
      <p>
        Angaben gemäß § 5 Digitale-Dienste-Gesetz (DDG) für dieses
        Telemedienangebot.
      </p>
      <h2>Anbieter</h2>
      <p>
        {OPERATOR_NAME}
        <br />
        E-Mail: <Mail />
      </p>
      <p>
        Dies ist ein privates, unentgeltliches Angebot. Es wird kein Entgelt
        für die Nutzung der App verlangt.
      </p>
      <h2>Kontakt</h2>
      <p>
        Für Rückfragen, Datenschutz und berechtigte Auskunftsersuchen:
        <br />
        <Mail />
      </p>
      <h2>Verantwortlich für den Inhalt</h2>
      <p>{OPERATOR_NAME}</p>
      <h2>Hinweis</h2>
      <p>
        Wie die App mit deinem eigenen OpenAI-Schlüssel arbeitet, welche Kosten
        bei OpenAI entstehen können und dass die KI Fehler machen kann, steht
        unter <a href="#nutzung">Nutzung und Kosten</a>. Die Verarbeitung
        personenbezogener Daten ist in der{" "}
        <a href="#datenschutz">Datenschutzerklärung</a> beschrieben.
      </p>
    </>
  );
}

function Nutzung() {
  return (
    <>
      <h1>Nutzung und Kosten</h1>
      <h2>Eigener Schlüssel, kein Teilen</h2>
      <p>
        Die App prüft Texte nur, wenn du einen eigenen API-Schlüssel von OpenAI
        einträgst. Der Betreiber legt keinen Schlüssel für dich in die App und
        teilt keinen Schlüssel. Jede Nutzerin und jeder Nutzer verwendet
        ausschließlich den eigenen Schlüssel.
      </p>
      <p>
        Den Schlüssel bekommst du bei OpenAI (Konto, API-Zugang). Er wird nur in
        diesem Browser auf diesem Gerät gespeichert, nicht in der App-Datei und
        nicht beim Betreiber.
      </p>
      <h2>Was die Prüfung macht</h2>
      <p>
        Du öffnest eine Word-Datei (.docx) auf deinem Rechner. Die Datei bleibt
        bei dir. Erst wenn du „Kapitel prüfen“ wählst, wird der Text des
        Kapitels zusammen mit deinem Schlüssel an die Prüf-Schnittstelle dieser
        Website geschickt. Von dort geht beides an OpenAI. Die App schlägt
        mögliche Fehlerstellen vor. Du entscheidest jede Stelle selbst. Über
        „Speichern unter“ legst du eine Kopie ab — die Originaldatei wird nicht
        still überschrieben.
      </p>
      <h2>Kosten bei OpenAI</h2>
      <p>
        Die Nutzung dieser App ist unentgeltlich. Die künstliche Intelligenz
        rechnet OpenAI mit dem Konto ab, zu dem dein Schlüssel gehört. Es
        können nutzungsabhängige Gebühren nach den jeweils geltenden Preisen
        von OpenAI entstehen. Der Betreiber stellt keine Rechnung und erhält
        dein Entgelt nicht.
      </p>
      <p>
        Aktuelle Preise und Kontingente stehen bei OpenAI, zum Beispiel unter{" "}
        <a
          href="https://openai.com/api/pricing"
          rel="noreferrer"
          target="_blank"
        >
          openai.com/api/pricing
        </a>
        . Wie hoch eine Prüfung ausfällt, hängt von Textlänge, gewähltem Modell
        und den Tarifen von OpenAI ab. Das kann sich ändern.
      </p>
      <p>
        Für ein OpenAI-Konto, Zahlungsdaten, Limits und Kündigung gelten die
        Verträge und Hinweise zwischen dir und OpenAI, nicht mit dem Betreiber
        dieser App.
      </p>
      <h2>Die KI kann Fehler machen</h2>
      <p>
        Die Prüfung ist eine Hilfe, kein fertiges Lektorat und kein Ersatz für
        sorgfältiges Selbstlesen oder eine menschliche Lektorin. Die KI kann
        Fehler übersehen, Stellen zu Unrecht markieren, unsinnige oder zum
        Text unpassende Vorschläge machen und sich irren — besonders bei
        Dialekt, Namen, neuen Wörtern und bewusstem Stil.
      </p>
      <p>
        Du siehst jede Fundstelle und entscheidest. Vorschläge, die du
        übernimmst, musst du selbst prüfen, bevor du einen Text veröffentlichst
        oder drucken lässt. Es wird nicht zugesichert, dass alle Fehler gefunden
        werden oder dass ein Vorschlag sprachlich oder inhaltlich stimmt.
      </p>
      <h2>Haftung</h2>
      <p>
        Die App wird unentgeltlich und ohne Gewähr für ein bestimmtes
        Korrektur-Ergebnis bereitgestellt. Der Betreiber haftet nicht für
        Schäden aus der Nutzung oder Unvollständigkeit der Vorschläge, soweit
        das gesetzlich zulässig ist. Unberührt bleibt die Haftung für Vorsatz,
        grobe Fahrlässigkeit und für Schäden aus der Verletzung des Lebens, des
        Körpers oder der Gesundheit.
      </p>
    </>
  );
}

function Datenschutz() {
  return (
    <>
      <h1>Datenschutzerklärung</h1>
      <p>
        Diese Erklärung beschreibt, welche Daten bei der Nutzung von Korrektur
        Wrapper verarbeitet werden. Kurz: Dein Manuskript bleibt auf deinem
        Gerät, bis du eine Prüfung anstößt. Dann gehen Text und dein eigener
        OpenAI-Schlüssel an OpenAI. Der Betreiber speichert weder Schlüssel noch
        Buchdateien.
      </p>

      <h2>1. Verantwortlicher</h2>
      <p>
        {OPERATOR_NAME}
        <br />
        E-Mail: <Mail />
      </p>

      <h2>2. Hosting und Aufruf der Website</h2>
      <p>
        Beim Öffnen der Seite werden übliche technische Daten verarbeitet, die
        der Browser mitsendet, insbesondere IP-Adresse, Zeitpunkt und
        aufgerufene Adresse. Das ist nötig, um die Website auszuliefern und den
        Betrieb zu schützen (Art. 6 Abs. 1 lit. f DSGVO).
      </p>
      <p>
        Wird die Website über Cloudflare Pages bereitgestellt, setzt Cloudflare,
        Inc. (USA) Server und ein Inhaltsnetz ein. Dabei können die genannten
        technischen Daten bei Cloudflare anfallen. Hinweise von Cloudflare:{" "}
        <a
          href="https://www.cloudflare.com/privacypolicy/"
          rel="noreferrer"
          target="_blank"
        >
          cloudflare.com/privacypolicy
        </a>
        . Läuft die App nur auf deinem Rechner (localhost), findet dieser Abruf
        nicht über Cloudflare statt.
      </p>

      <h2>3. Dateien und Eingaben im Browser</h2>
      <p>
        Word-Dateien öffnest du lokal. Sie werden im Browser gelesen und
        geändert. Eine Kopie speicherst du selbst auf deinem Gerät. Der
        Betreiber erhält die Datei nicht als Upload-Archiv.
      </p>
      <p>
        API-Schlüssel und Modellwahl können in deinem Browser gespeichert
        werden (localStorage), damit du sie nicht jedes Mal neu eintragen musst.
        Das geschieht nur auf dein Anstoßen (Art. 6 Abs. 1 lit. b DSGVO, § 25
        Abs. 2 TTDSG). Du kannst den Schlüssel in der App ändern; im Browser
        kannst du gespeicherte Daten auch selbst löschen.
      </p>

      <h2>4. Prüfung über OpenAI</h2>
      <p>
        Wenn du „Kapitel prüfen“ wählst, werden der Kapiteltext, dein
        API-Schlüssel und die Modellangabe an die Schnittstelle dieser Website
        (/api/pruefen) gesendet und von dort an die Programmierschnittstelle
        von OpenAI, Inc. (USA) weitergegeben. Ohne diese Übermittlung kann die
        Prüfung nicht stattfinden (Art. 6 Abs. 1 lit. b DSGVO).
      </p>
      <p>
        Der Betreiber stellt keinen eigenen Schlüssel bereit und soll deinen
        Schlüssel nicht dauerhaft speichern. Es findet kein Schlüssel-Teilen
        statt. OpenAI verarbeitet die Daten im Rahmen deines Vertrags mit
        OpenAI. Es können dort Protokolle, Nutzungs- und Abrechnungsdaten
        entstehen. Maßgeblich sind die Bedingungen und die Datenschutzerklärung
        von OpenAI, unter anderem{" "}
        <a
          href="https://openai.com/policies/privacy-policy"
          rel="noreferrer"
          target="_blank"
        >
          openai.com/policies/privacy-policy
        </a>{" "}
        und die API-Nutzungsbedingungen.
      </p>
      <p>
        Eine Übermittlung in die USA kann stattfinden. OpenAI und Cloudflare
        können unter dem EU-US Data Privacy Framework zertifiziert sein oder
        Standardvertragsklauseln nutzen. Das Schutzniveau kann von dem in der
        EU abweichen.
      </p>

      <h2>5. Keine Werbung, kein Konto beim Betreiber</h2>
      <p>
        Der Betreiber führt kein Nutzerkonto für die App, versendet keine
        Newsletter und setzt keine Tracking-Cookies für Werbung oder Reichweite
        ein.
      </p>

      <h2>6. Speicherdauer</h2>
      <p>
        Im Browser bleiben Schlüssel und Modellwahl, bis du sie änderst oder
        löschst. Technische Serverprotokolle (etwa beim Hosting) richten sich
        nach den Fristen des jeweiligen Anbieters und nach dem, was für
        Sicherheit und Betrieb nötig ist. Manuskripte sollen beim Betreiber
        nicht gespeichert werden.
      </p>

      <h2>7. Deine Rechte</h2>
      <p>
        Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung
        der Verarbeitung, Datenübertragbarkeit und Widerspruch gegen
        Verarbeitungen auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO, jeweils
        nach den gesetzlichen Voraussetzungen. Außerdem hast du das Recht auf
        Beschwerde bei einer Datenschutz-Aufsichtsbehörde, zum Beispiel über{" "}
        <a href="https://www.bfdi.bund.de" rel="noreferrer" target="_blank">
          bfdi.bund.de
        </a>
        .
      </p>
      <p>
        Für Daten, die nur auf deinem Gerät oder nur bei OpenAI liegen, muss du
        Auskunft und Löschung dort verlangen bzw. selbst im Browser löschen.
        Anfragen an den Betreiber: <Mail />.
      </p>

      <h2>8. Pflicht zur Bereitstellung</h2>
      <p>
        Die Website kannst du ohne Schlüssel ansehen. Für die KI-Prüfung sind
        Schlüssel und Textübermittlung an OpenAI erforderlich. Ohne sie findet
        keine Prüfung statt.
      </p>
    </>
  );
}
