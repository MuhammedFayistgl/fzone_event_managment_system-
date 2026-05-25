import { useState } from "react";
import { BookOpen, FileText, Download } from "lucide-react";
import { Button } from "rsuite";
import toast from "react-hot-toast";
import { downloadStaticFile } from "../../utils/downloadFile";

const PDF_URL = "/guides/F-Zone-Client-Guide.pdf";
const TXT_URL = "/guides/F-Zone-Client-Guide.txt";

export default function ClientGuideSection() {
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [loadingTxt, setLoadingTxt] = useState(false);

  const handleDownload = async (
    url: string,
    filename: string,
    setLoading: (v: boolean) => void
  ) => {
    setLoading(true);
    try {
      await downloadStaticFile(url, filename);
      toast.success("Download started");
    } catch {
      toast.error("Guide file not found. Contact your developer to sync the guide.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="app-card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <BookOpen size={18} />
        <div>
          <h2 className="text-lg font-semibold text-app-text">Client Guide / User Manual</h2>
          <p className="text-sm text-app-muted mt-0.5">
            Malayalam + English tutorial with screenshots — events, staff, payments & more.
          </p>
        </div>
      </div>

      <p className="text-sm text-app-muted">
        ക്ലയന്റ് ഗൈഡ് PDF &amp; text version — WhatsApp/email-ൽ share ചെയ്യാൻ text guide ഉപയോഗിക്കാം.
      </p>

      <div className="flex flex-wrap gap-3">
        <Button
          appearance="primary"
          loading={loadingPdf}
          disabled={loadingPdf || loadingTxt}
          onClick={() =>
            handleDownload(PDF_URL, "F-Zone-Client-Guide.pdf", setLoadingPdf)
          }
          className="auth-shell__submit !w-auto !px-5 inline-flex items-center gap-2"
        >
          <Download size={16} />
          Download PDF
        </Button>
        <Button
          appearance="ghost"
          loading={loadingTxt}
          disabled={loadingPdf || loadingTxt}
          onClick={() =>
            handleDownload(TXT_URL, "F-Zone-Client-Guide.txt", setLoadingTxt)
          }
          className="inline-flex items-center gap-2"
        >
          <FileText size={16} />
          Download text guide
        </Button>
      </div>
    </section>
  );
}
