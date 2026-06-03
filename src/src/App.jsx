import { useState, useRef } from "react";

const SYSTEM_PROMPT = `Sos un asistente que transforma conversaciones de LinkedIn en HTML visualmente atractivo para generar un PDF de chat.

El usuario te va a pegar una conversación copiada de LinkedIn. Tu tarea es:
1. Identificar los participantes de la conversación
2. Parsear los mensajes con sus emisores
3. Devolver SOLO un JSON válido (sin texto extra, sin markdown, sin backticks) con este formato exacto:

{
  "participants": [
    {"name": "Nombre Persona 1", "initials": "NP", "color": "#4F46E5"},
    {"name": "Nombre Persona 2", "initials": "NP2", "color": "#0EA5E9"}
  ],
  "messages": [
    {"sender": "Nombre exacto del sender", "text": "texto del mensaje", "time": "hora si existe o null"}
  ],
  "title": "Conversación con [nombre principal]"
}

Reglas importantes:
- Devuelve SOLO el JSON, sin ningún texto adicional
- El primer participante es siempre el que inició la conversación o el que aparece primero
- Asigna colores variados y bonitos a cada participante
- Si hay timestamps, incluílos. Si no, ponés null
- Limpiá el texto de caracteres extraños o artefactos de copiado
- Si el texto no parece una conversación de LinkedIn, devuelve: {"error": "No parece una conversación de LinkedIn. Por favor pegá el texto copiado directamente desde LinkedIn."}`;

export default function App() {
  const [input, setInput] = useState("");
  const [parsed, setParsed] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("anthropic_key") || "");
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [step, setStep] = useState("input");
  const printRef = useRef();

  const saveKey = (key) => {
    setApiKey(key);
    localStorage.setItem("anthropic_key", key);
    setShowKeyInput(false);
  };

  const parseConversation = async () => {
    if (!input.trim()) return;

    const key = apiKey || import.meta.env.VITE_ANTHROPIC_API_KEY;
    if (!key) {
      setShowKeyInput(true);
      return;
    }

    setLoading(true);
    setError("");
    setParsed(null);

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: input }],
        }),
      });

      if (res.status === 401) {
        setError("API key inválida. Revisá que esté bien copiada.");
        setShowKeyInput(true);
        setLoading(false);
        return;
      }

      const data = await res.json();
      const raw = data.content?.find((b) => b.type === "text")?.text || "";
      const cleaned = raw.replace(/```json|```/g, "").trim();
      const json = JSON.parse(cleaned);

      if (json.error) {
        setError(json.error);
      } else {
        setParsed(json);
        setStep("preview");
      }
    } catch (e) {
      setError("Hubo un error al procesar. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const isFirstParticipant = (senderName) =>
    parsed?.participants?.[0]?.name === senderName;

  const getColor = (senderName) =>
    parsed?.participants?.find((p) => p.name === senderName)?.color || "#6366f1";

  const getInitials = (senderName) =>
    parsed?.participants?.find((p) => p.name === senderName)?.initials ||
    senderName?.slice(0, 2).toUpperCase() ||
    "??";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f5f3ff; font-family: 'Plus Jakarta Sans', sans-serif; }

        .app { min-height: 100vh; background: #f5f3ff; }

        .topbar {
          background: #fff;
          border-bottom: 1px solid #ede9fe;
          padding: 14px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .logo { display: flex; align-items: center; gap: 10px; }
        .logo-icon {
          width: 34px; height: 34px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          font-size: 17px; color: white;
        }
        .logo-name { font-size: 15px; font-weight: 700; color: #1e1b4b; }
        .logo-tag { font-size: 11px; color: #a78bfa; display: block; }

        .topbar-right { display: flex; gap: 8px; align-items: center; }

        .btn {
          display: inline-flex; align-items: center; justify-content: center;
          gap: 7px; padding: 9px 18px;
          border-radius: 10px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 13px; font-weight: 600;
          cursor: pointer; border: none; transition: all 0.18s;
          text-decoration: none;
        }
        .btn-ghost {
          background: transparent; color: #6b7280;
          border: 1px solid #e5e7eb;
        }
        .btn-ghost:hover { background: #f3f4f6; }
        .btn-primary {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white; width: 100%; margin-top: 14px;
          padding: 13px; font-size: 14px; border-radius: 12px;
        }
        .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
        .btn-primary:disabled { opacity: 0.55; transform: none; cursor: not-allowed; }
        .btn-green {
          background: #16a34a; color: white;
          padding: 10px 20px; font-size: 13px; border-radius: 10px;
        }
        .btn-green:hover { background: #15803d; }
        .btn-outline-indigo {
          background: white; color: #4f46e5;
          border: 1.5px solid #c7d2fe; padding: 9px 16px; border-radius: 10px;
        }
        .btn-outline-indigo:hover { background: #eef2ff; }

        .main { max-width: 680px; margin: 0 auto; padding: 36px 20px 60px; }

        .hero { text-align: center; margin-bottom: 32px; }
        .badge {
          display: inline-flex; align-items: center; gap: 5px;
          background: #ede9fe; color: #6d28d9;
          font-size: 12px; font-weight: 600;
          padding: 5px 13px; border-radius: 20px; margin-bottom: 14px;
        }
        .hero h1 {
          font-size: 26px; font-weight: 700; color: #1e1b4b;
          line-height: 1.3; margin-bottom: 10px;
        }
        .hero p { font-size: 14px; color: #6b7280; line-height: 1.6; }

        .steps {
          display: flex; align-items: center; justify-content: center;
          gap: 8px; margin-bottom: 28px; flex-wrap: wrap;
        }
        .step-item { display: flex; align-items: center; gap: 7px; font-size: 13px; color: #9ca3af; }
        .step-item.active { color: #4f46e5; font-weight: 600; }
        .step-num {
          width: 22px; height: 22px; border-radius: 50%;
          background: #e5e7eb;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 700; color: #9ca3af;
        }
        .step-item.active .step-num { background: #4f46e5; color: white; }
        .step-div { width: 28px; height: 1px; background: #e5e7eb; }

        .card {
          background: #fff; border-radius: 16px;
          border: 1px solid #ede9fe; overflow: hidden;
        }
        .card-head {
          padding: 14px 18px; border-bottom: 1px solid #f5f3ff;
          background: #fdfcff;
          display: flex; align-items: center; gap: 8px;
          font-size: 14px; font-weight: 600; color: #1e1b4b;
        }
        .card-body { padding: 18px; }

        textarea {
          width: 100%; min-height: 220px;
          border: 1.5px solid #e5e7eb; border-radius: 12px;
          padding: 13px 15px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 14px; color: #374151;
          resize: vertical; outline: none; line-height: 1.6;
          transition: border-color 0.2s; background: #fafafa;
        }
        textarea:focus { border-color: #6366f1; background: #fff; }
        textarea::placeholder { color: #9ca3af; font-size: 13px; }

        .tip {
          display: flex; gap: 9px;
          background: #f0f9ff; border: 1px solid #bae6fd;
          border-radius: 10px; padding: 11px 13px; margin-top: 12px;
        }
        .tip p { font-size: 12.5px; color: #0369a1; line-height: 1.5; }

        .error-box {
          background: #fef2f2; border: 1px solid #fecaca;
          border-radius: 10px; padding: 11px 13px; margin-top: 10px;
          font-size: 13px; color: #dc2626;
        }

        .spinner-wrap { text-align: center; padding: 36px 20px; }
        .spinner {
          width: 34px; height: 34px;
          border: 3px solid #e0e0ff; border-top-color: #6366f1;
          border-radius: 50%; animation: spin 0.75s linear infinite;
          margin: 0 auto 12px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spinner-wrap p { font-size: 14px; color: #6b7280; }

        /* API KEY MODAL */
        .modal-bg {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.45);
          display: flex; align-items: center; justify-content: center;
          z-index: 100; padding: 20px;
        }
        .modal {
          background: white; border-radius: 16px;
          padding: 28px; max-width: 440px; width: 100%;
          box-shadow: 0 20px 60px rgba(0,0,0,0.15);
        }
        .modal h2 { font-size: 18px; font-weight: 700; color: #1e1b4b; margin-bottom: 8px; }
        .modal p { font-size: 13px; color: #6b7280; line-height: 1.6; margin-bottom: 16px; }
        .modal input {
          width: 100%; border: 1.5px solid #e5e7eb; border-radius: 10px;
          padding: 11px 13px; font-size: 14px; outline: none;
          font-family: 'Plus Jakarta Sans', sans-serif; margin-bottom: 12px;
        }
        .modal input:focus { border-color: #6366f1; }
        .modal a { color: #6366f1; font-size: 12px; }
        .modal-btns { display: flex; gap: 8px; margin-top: 4px; }
        .modal-btns .btn { flex: 1; justify-content: center; }

        /* PREVIEW AREA */
        .preview-bar {
          display: flex; align-items: center;
          justify-content: space-between;
          margin-bottom: 18px; flex-wrap: wrap; gap: 10px;
        }
        .preview-bar-left { font-size: 14px; color: #6b7280; }
        .preview-bar-left strong { color: #1e1b4b; }
        .preview-bar-right { display: flex; gap: 8px; }

        /* PDF DESIGN */
        .pdf-wrap {
          background: #fff; border-radius: 16px;
          border: 1px solid #ede9fe; overflow: hidden;
        }
        .pdf-head {
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
          padding: 22px 22px 18px;
        }
        .pdf-head-top {
          display: flex; align-items: center; gap: 12px; margin-bottom: 14px;
        }
        .li-badge {
          background: rgba(255,255,255,0.18);
          width: 38px; height: 38px; border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          font-size: 20px; font-weight: 900; color: white;
          font-family: Georgia, serif; flex-shrink: 0;
        }
        .pdf-title { font-size: 19px; font-weight: 700; color: white; }
        .pdf-sub { font-size: 12px; color: rgba(255,255,255,0.7); }
        .p-pills { display: flex; gap: 8px; flex-wrap: wrap; }
        .p-pill {
          display: flex; align-items: center; gap: 6px;
          background: rgba(255,255,255,0.14);
          border: 1px solid rgba(255,255,255,0.22);
          border-radius: 20px; padding: 4px 11px 4px 5px;
        }
        .p-pill-av {
          width: 21px; height: 21px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 9px; font-weight: 700; color: white; flex-shrink: 0;
        }
        .p-pill span { font-size: 12px; color: rgba(255,255,255,0.88); font-weight: 500; }

        .msgs { padding: 18px 18px 6px; }

        .msg-row { display: flex; gap: 9px; margin-bottom: 14px; align-items: flex-end; }
        .msg-row.right { flex-direction: row-reverse; }

        .av {
          width: 32px; height: 32px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 700; color: white; flex-shrink: 0;
        }

        .msg-inner { max-width: 70%; }
        .msg-row.right .msg-inner {
          display: flex; flex-direction: column; align-items: flex-end;
        }

        .sndr { font-size: 10.5px; color: #9ca3af; margin-bottom: 3px; font-weight: 600; }
        .msg-row.right .sndr { text-align: right; }

        .bubble {
          padding: 9px 13px; font-size: 13.5px;
          line-height: 1.55; word-break: break-word;
          background: #f3f4f6; color: #1e1b4b;
          border-radius: 14px 14px 14px 3px;
        }
        .msg-row.right .bubble {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          border-radius: 14px 14px 3px 14px;
        }

        .ts { font-size: 10px; color: #9ca3af; margin-top: 3px; }
        .msg-row.right .ts { text-align: right; }

        .pdf-foot {
          text-align: center; padding: 12px;
          border-top: 1px solid #f3f0ff;
          font-size: 11px; color: #c4b5fd;
        }

        @media print {
          .no-print { display: none !important; }
          body, .app { background: white; }
          .main { padding: 0; max-width: 100%; }
          .pdf-wrap { border: none; border-radius: 0; }
          .pdf-head, .bubble, .msg-row.right .bubble {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>

      <div className="app">
        {/* API KEY MODAL */}
        {showKeyInput && (
          <div className="modal-bg">
            <div className="modal">
              <h2>🔑 Ingresá tu API Key de Anthropic</h2>
              <p>
                Para usar esta app necesitás una API Key de Anthropic. Es gratuita para empezar.{" "}
                <a href="https://console.anthropic.com/keys" target="_blank" rel="noreferrer">
                  Obtené una acá →
                </a>
              </p>
              <input
                type="password"
                placeholder="sk-ant-..."
                defaultValue={apiKey}
                id="api-key-input"
              />
              <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 0 }}>
                Tu key se guarda solo en tu navegador, nunca en ningún servidor.
              </p>
              <div className="modal-btns">
                <button
                  className="btn btn-ghost"
                  onClick={() => setShowKeyInput(false)}
                >
                  Cancelar
                </button>
                <button
                  className="btn btn-primary"
                  style={{ marginTop: 0 }}
                  onClick={() => {
                    const val = document.getElementById("api-key-input").value.trim();
                    if (val) saveKey(val);
                  }}
                >
                  Guardar y continuar
                </button>
              </div>
            </div>
          </div>
        )}

        <header className="topbar no-print">
          <div className="logo">
            <div className="logo-icon">💬</div>
            <div>
              <div className="logo-name">LinkedPDF</div>
              <span className="logo-tag">Convertidor de chats</span>
            </div>
          </div>
          <div className="topbar-right">
            <button className="btn btn-ghost" onClick={() => setShowKeyInput(true)}>
              🔑 API Key
            </button>
            {step === "preview" && (
              <button
                className="btn btn-outline-indigo"
                onClick={() => { setStep("input"); setParsed(null); setInput(""); setError(""); }}
              >
                ← Nueva
              </button>
            )}
          </div>
        </header>

        <div className="main">
          {step === "input" && (
            <>
              <div className="hero no-print">
                <div className="badge">✨ Powered by Claude AI</div>
                <h1>Transformá tus chats de LinkedIn en PDFs visuales</h1>
                <p>Pegá cualquier conversación de LinkedIn y la convertimos en un PDF prolijo, lindo y fácil de leer.</p>
              </div>

              <div className="steps no-print">
                <div className="step-item active">
                  <div className="step-num">1</div>
                  <span>Pegá el chat</span>
                </div>
                <div className="step-div" />
                <div className="step-item">
                  <div className="step-num">2</div>
                  <span>Vista previa</span>
                </div>
                <div className="step-div" />
                <div className="step-item">
                  <div className="step-num">3</div>
                  <span>Descargá el PDF</span>
                </div>
              </div>

              <div className="card">
                <div className="card-head">
                  <span>📋</span> Pegá tu conversación de LinkedIn
                </div>
                <div className="card-body">
                  {loading ? (
                    <div className="spinner-wrap">
                      <div className="spinner" />
                      <p>Analizando la conversación con IA...</p>
                    </div>
                  ) : (
                    <>
                      <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={`Copiá y pegá acá el texto de tu conversación de LinkedIn...\n\nEjemplo:\nJuan Pérez\nHola! Vi tu perfil, me parece muy interesante tu experiencia.\n2:30 PM\n\nVos\nGracias Juan! ¿En qué te puedo ayudar?\n2:45 PM`}
                      />
                      {error && <div className="error-box">⚠️ {error}</div>}
                      <button
                        className="btn btn-primary"
                        onClick={parseConversation}
                        disabled={!input.trim() || loading}
                      >
                        ✨ Transformar en PDF visual
                      </button>
                      <div className="tip">
                        <span>💡</span>
                        <p>
                          <strong>¿Cómo copiar?</strong> Abrí el chat en LinkedIn, seleccioná todos los mensajes y pegálos acá. Funciona mejor con el texto completo incluyendo nombres y horarios.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </>
          )}

          {step === "preview" && parsed && (
            <>
              <div className="preview-bar no-print">
                <div className="preview-bar-left">
                  Vista previa — <strong>{parsed.title || "Conversación"}</strong>
                </div>
                <div className="preview-bar-right">
                  <button className="btn btn-green" onClick={() => window.print()}>
                    ⬇️ Descargar PDF
                  </button>
                </div>
              </div>

              <div className="pdf-wrap" ref={printRef}>
                <div className="pdf-head">
                  <div className="pdf-head-top">
                    <div className="li-badge">in</div>
                    <div>
                      <div className="pdf-title">{parsed.title || "Conversación de LinkedIn"}</div>
                      <div className="pdf-sub">Exportado desde LinkedIn Messaging</div>
                    </div>
                  </div>
                  <div className="p-pills">
                    {parsed.participants?.map((p, i) => (
                      <div key={i} className="p-pill">
                        <div className="p-pill-av" style={{ background: p.color }}>{p.initials}</div>
                        <span>{p.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="msgs">
                  {parsed.messages?.map((msg, i) => {
                    const right = isFirstParticipant(msg.sender);
                    return (
                      <div key={i} className={`msg-row ${right ? "right" : "left"}`}>
                        <div className="av" style={{ background: getColor(msg.sender) }}>
                          {getInitials(msg.sender)}
                        </div>
                        <div className="msg-inner">
                          <div className="sndr">{msg.sender}</div>
                          <div className="bubble">{msg.text}</div>
                          {msg.time && <div className="ts">{msg.time}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pdf-foot">
                  Generado con LinkedPDF ·{" "}
                  {new Date().toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
