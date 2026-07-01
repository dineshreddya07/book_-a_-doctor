import { useState, useEffect, useRef } from 'react';
import { FaRobot, FaExclamationTriangle, FaTrash, FaCheckCircle, FaChevronRight, FaPaperPlane } from 'react-icons/fa';
import api from '../../services/api';

const MODES = [
  { value: 'assistant', label: 'AI Health Assistant', desc: 'General wellness guidelines and clinical navigation support' },
  { value: 'symptom_checker', label: 'Symptom Checker', desc: 'Determine red-flags and general medical guidance' },
  { value: 'specialization', label: 'Specialist Recommender', desc: 'Identify the exact doctor specialty you need' },
  { value: 'report_summarizer', label: 'Report Summarizer', desc: 'Translate medical records and laboratory values' },
  { value: 'health_tips', label: 'Health Coach Tips', desc: 'Practical exercises, dietary charts, and daily advice' },
];

const AiAssistantPage = () => {
  const [mode, setMode] = useState('assistant');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const chatEndRef = useRef(null);

  // Fetch session history on mount
  const fetchHistory = async () => {
    try {
      const res = await api.get('/ai/history');
      setMessages(res.data.data);
    } catch (err) {
      console.error('Failed to load AI history:', err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');
    setError('');
    setLoading(true);

    // Optimistically push user message
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);

    try {
      const res = await api.post('/ai/chat', { mode, input: userMessage });
      const aiReply = res.data.data.response;
      
      // Push AI reply
      setMessages((prev) => [...prev, { role: 'model', content: aiReply }]);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to reach the AI assistant.');
      // Remove last user message on failure to let them retry
      setMessages((prev) => prev.slice(0, -1));
      setInput(userMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm('Are you sure you want to delete all AI assistant chat sessions?')) return;
    try {
      await api.delete('/ai/history');
      setMessages([]);
      setError('');
    } catch (err) {
      setError('Failed to clear session logs.');
    }
  };

  // Safe custom Markdown formatter helper
  const renderMessageContent = (text) => {
    if (!text) return '';
    
    // Protect raw tags
    let formatted = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    // Header tags
    formatted = formatted.replace(/^### (.*?)$/gm, '<h6 class="fw-bold mt-2 mb-1">$1</h6>');
    formatted = formatted.replace(/^## (.*?)$/gm, '<h5 class="fw-bold mt-3 mb-2">$1</h5>');
    formatted = formatted.replace(/^# (.*?)$/gm, '<h4 class="fw-bold mt-3 mb-2">$1</h4>');

    // Bold tags
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Italic tags
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Bullet lists items
    formatted = formatted.replace(/^\s*\*\s+(.*?)$/gm, '<li class="ms-3 mb-1">$1</li>');
    formatted = formatted.replace(/^\s*-\s+(.*?)$/gm, '<li class="ms-3 mb-1">$1</li>');

    // Line breaks
    formatted = formatted.replace(/\n/g, '<br />');

    return <div className="markdown-body" dangerouslySetInnerHTML={{ __html: formatted }} />;
  };

  return (
    <div className="container py-4">
      <div className="row g-4">
        {/* Modes list panel */}
        <div className="col-lg-4">
          <div className="card shadow-sm border-0 rounded-4 p-4 bg-white">
            <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
              <FaRobot className="text-primary" /> Assistant Modes
            </h5>
            <div className="d-flex flex-column gap-2 mb-4">
              {MODES.map((item) => {
                const isSelected = mode === item.value;
                return (
                  <button
                    key={item.value}
                    onClick={() => setMode(item.value)}
                    className={`btn text-start rounded-3 p-3 border-0 transition-all ${
                      isSelected ? 'btn-primary shadow-xs' : 'btn-light text-dark'
                    }`}
                  >
                    <div className="fw-bold small">{item.label}</div>
                    <div className={`small opacity-75 mt-0.5 ${isSelected ? 'text-white' : 'text-secondary'}`} style={{ fontSize: '0.75rem' }}>
                      {item.desc}
                    </div>
                  </button>
                );
              })}
            </div>

            <button onClick={handleClearHistory} className="btn btn-outline-danger w-100 rounded-pill btn-sm d-flex align-items-center justify-content-center gap-1.5">
              <FaTrash /> Clear Conversation logs
            </button>
          </div>
        </div>

        {/* Chat log dialog space */}
        <div className="col-lg-8">
          <div className="card shadow-sm border-0 rounded-4 p-4 bg-white d-flex flex-column" style={{ height: '620px' }}>
            {/* Header Disclaimer */}
            <div className="alert alert-warning border-0 rounded-3 mb-3 small d-flex gap-2.5 align-items-start">
              <FaExclamationTriangle className="text-warning mt-1 fs-5" />
              <div>
                <span className="fw-bold">Medical Disclaimer:</span> This AI assistant provides informational triages based on clinical guidelines. It is not an active diagnosis. For any severe symptoms, chest pressures, or emergencies, seek instant clinical treatments.
              </div>
            </div>

            {/* Messages box list */}
            <div className="flex-grow-1 overflow-auto bg-light rounded-4 p-3 mb-3 d-flex flex-column gap-4.5 border border-light">
              {messages.length === 0 ? (
                <div className="m-auto text-center text-secondary py-5">
                  <FaRobot className="display-4 text-muted mb-3 floating-bob" />
                  <h5 className="fw-bold">Start an AI Consultation Session</h5>
                  <p className="small">Select a mode on the left panel, describe your concerns, and receive analysis guides.</p>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isUser = msg.role === 'user';
                  return (
                    <div key={index} className={`d-flex ${isUser ? 'justify-content-end' : 'justify-content-start'}`}>
                      <div className="d-flex align-items-start gap-2.5 max-width-85">
                        {!isUser && (
                          <span className="bg-primary-subtle text-primary p-2.5 rounded-circle fs-5 d-flex align-items-center justify-content-center" style={{ width: '42px', height: '42px' }}>
                            🤖
                          </span>
                        )}
                        <div
                          className={`p-3 rounded-4 shadow-xs ${
                            isUser
                              ? 'bg-primary text-white rounded-tr-0'
                              : 'bg-white text-dark border rounded-tl-0'
                          }`}
                        >
                          {isUser ? msg.content : renderMessageContent(msg.content)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              {loading && (
                <div className="d-flex justify-content-start">
                  <div className="d-flex align-items-center gap-2.5">
                    <span className="bg-primary-subtle text-primary p-2.5 rounded-circle fs-5 d-flex align-items-center justify-content-center" style={{ width: '42px', height: '42px' }}>
                      🤖
                    </span>
                    <div className="bg-white text-dark border p-3 rounded-4 rounded-tl-0 d-flex gap-1.5 align-items-center">
                      <span className="spinner-grow spinner-grow-sm text-primary animate-pulse" />
                      <span className="spinner-grow spinner-grow-sm text-primary animate-pulse" style={{ animationDelay: '0.2s' }} />
                      <span className="spinner-grow spinner-grow-sm text-primary animate-pulse" style={{ animationDelay: '0.4s' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {error && <div className="alert alert-danger py-2 px-3 small rounded-3 mb-2">{error}</div>}

            {/* Input Submission */}
            <form onSubmit={handleSubmit} className="d-flex gap-2">
              <input
                type="text"
                className="form-control rounded-pill border-2 ps-3.5"
                placeholder={`Describe your concern in ${MODES.find(m => m.value === mode)?.label} mode...`}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
              />
              <button
                type="submit"
                className="btn btn-primary rounded-circle p-3 d-flex align-items-center justify-content-center shadow-sm"
                style={{ width: '50px', height: '50px' }}
                disabled={loading || !input.trim()}
              >
                <FaPaperPlane size={18} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiAssistantPage;
