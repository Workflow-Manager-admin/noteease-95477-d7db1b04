import React, { useState, useEffect, useRef } from "react";
import "./App.css";

// Color Palette (used via inline vars and custom properties)
// primary:   #1976d2
// secondary: #424242
// accent:    #ffb300

// PUBLIC_INTERFACE
function App() {
  // All notes state (local)
  const [notes, setNotes] = useState(() => {
    // Retrieve from localStorage on mount
    const data = window.localStorage.getItem("notes");
    return data ? JSON.parse(data) : [];
  });
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [editorValue, setEditorValue] = useState("");
  const [editorTitle, setEditorTitle] = useState("");
  const [isNew, setIsNew] = useState(false);

  // Responsive: track window size for showing/hiding panels
  const [isMobile, setIsMobile] = useState(window.innerWidth < 700);
  const [showSidebar, setShowSidebar] = useState(!window.innerWidth < 700);

  // Palette is set via variables in App.css

  // Track selected note
  useEffect(() => {
    if (!selectedId && notes.length) {
      setSelectedId(notes[0].id);
    }
    // If deleting the selected, go to newest or clear
    if (selectedId && !notes.some((n) => n.id === selectedId)) {
      setSelectedId(notes.length ? notes[0].id : null);
    }
    // eslint-disable-next-line
  }, [notes]);

  // Save notes to localStorage on change
  useEffect(() => {
    window.localStorage.setItem("notes", JSON.stringify(notes));
  }, [notes]);

  // Update editor values when note selected
  useEffect(() => {
    if (selectedId) {
      const note = notes.find((n) => n.id === selectedId);
      if (note) {
        setEditorTitle(note.title);
        setEditorValue(note.body);
        setIsNew(false);
      }
    } else {
      setEditorTitle("");
      setEditorValue("");
    }
  }, [selectedId, notes]);

  // Responsive handler
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 700);
      setShowSidebar(window.innerWidth >= 700);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // PUBLIC_INTERFACE
  function handleNewNote() {
    setSelectedId(null);
    setEditorTitle("");
    setEditorValue("");
    setIsNew(true);
    setSearch(""); // Clear search so new note is always visible in the note list
    if (isMobile) setShowSidebar(false);
  }

  // PUBLIC_INTERFACE
  function handleSaveNote(e) {
    e && e.preventDefault();
    const title = editorTitle.trim() || "Untitled";
    const body = editorValue;

    if (isNew) {
      // Add new note
      const newNote = {
        id: Date.now().toString(),
        title,
        body,
        created: Date.now(),
        updated: Date.now(),
      };
      setNotes([newNote, ...notes]);
      setSelectedId(newNote.id);
      setIsNew(false);
      setSearch(""); // Clear search to ensure immediate visibility of new note
    } else {
      // Update existing
      setNotes((prevNotes) =>
        prevNotes.map((n) =>
          n.id === selectedId
            ? { ...n, title, body, updated: Date.now() }
            : n
        )
      );
    }
  }

  // PUBLIC_INTERFACE
  function handleDeleteNote(id) {
    if (window.confirm("Delete this note?")) {
      setNotes(notes.filter((n) => n.id !== id));
      if (selectedId === id) setSelectedId(null);
    }
  }

  // PUBLIC_INTERFACE
  function handleSelectNote(id) {
    setSelectedId(id);
    setIsNew(false);
    if (isMobile) setShowSidebar(false);
  }

  // PUBLIC_INTERFACE
  function handleSidebarToggle() {
    setShowSidebar((show) => !show);
  }

  // PUBLIC_INTERFACE
  function filteredNotes() {
    if (!search.trim()) return notes;
    const query = search.trim().toLowerCase();
    return notes.filter(
      (n) =>
        n.title.toLowerCase().includes(query) ||
        n.body.toLowerCase().includes(query)
    );
  }

  // PUBLIC_INTERFACE
  function handleEditorChange(e) {
    setEditorValue(e.target.value);
  }
  // PUBLIC_INTERFACE
  function handleTitleChange(e) {
    setEditorTitle(e.target.value);
  }

  // Keyboard shortcut: NEW note
  useEffect(() => {
    const keyHandler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "n") {
        e.preventDefault();
        handleNewNote();
      }
    };
    window.addEventListener("keydown", keyHandler);
    return () => window.removeEventListener("keydown", keyHandler);
    // eslint-disable-next-line
  }, []);

  // Style helpers
  const palette = {
    primary: "#1976d2",
    secondary: "#424242",
    accent: "#ffb300",
    // background: "var(--bg-primary)", // use CSS var
  };

  // Sidebar/note list
  function NoteList({ notes, selectedId, onSelect, onDelete }) {
    if (!notes.length) {
      return (
        <div className="notelist-empty">
          <span>No notes found.</span>
        </div>
      );
    }
    return (
      <ul className="notelist">
        {notes.map((n) => (
          <li
            key={n.id}
            className={`notelist-item${n.id === selectedId ? " selected" : ""}`}
            onClick={() => onSelect(n.id)}
            title={n.title}
            tabIndex={0}
            aria-selected={n.id === selectedId}
          >
            <div className="notelist-title">{n.title || "Untitled"}</div>
            <div className="notelist-meta">
              <span className="notelist-date">
                {new Date(n.updated).toLocaleDateString() +
                  " " +
                  new Date(n.updated).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
              </span>
              <button
                className="delete-btn"
                aria-label="Delete note"
                title="Delete"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(n.id);
                }}
                tabIndex={-1}
                style={{
                  background: "none",
                  border: "none",
                  color: palette.accent,
                  cursor: "pointer",
                  fontSize: "1em",
                  marginLeft: 8,
                }}
              >
                🗑️
              </button>
            </div>
          </li>
        ))}
      </ul>
    );
  }

  // Header
  function Header() {
    return (
      <header className="header" style={{
        background: palette.primary,
        color: "#fff",
      }}>
        <span className="menu-toggle-btn" style={{
          display: isMobile ? "inline" : "none",
        }}>
          <button
            aria-label="Open notes list"
            onClick={handleSidebarToggle}
            style={{
              background: "none",
              border: "none",
              color: "#fff",
              fontSize: "1.6em",
              marginRight: 8,
              cursor: "pointer"
            }}
          >
            ☰
          </button>
        </span>
        <span className="header-title" style={{
          fontWeight: 700,
          letterSpacing: 2,
          fontSize: "1.25em",
        }}>
          📝 NoteEase
        </span>
      </header>
    );
  }

  return (
    <div className="notetaker-app" style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}>
      <Header />
      <div className="main-row">
        {/* Sidebar/Left: Note List */}
        {(!isMobile || showSidebar) && (
          <aside
            className="sidebar"
            style={{
              borderRight: `1px solid ${palette.secondary}22`,
              background: "#fafbfc",
              minWidth: 220,
              width: 260,
              maxWidth: 320,
              flex: "0 0 260px",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              transition: "all 0.2s",
              zIndex: 3,
              boxShadow: isMobile && showSidebar ? "2px 0 8px #ccc1" : "none",
              position: isMobile ? "absolute" : "relative",
              top: isMobile ? 52 : 0,
              left: isMobile ? 0 : "auto",
            }}
          >
            {/* Hide on mobile unless toggled */}
            <div className="sidebar-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px 2px" }}>
              <input
                className="search-input"
                type="search"
                placeholder="Search notes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search notes"
                autoComplete="off"
                style={{
                  flex: 1,
                  borderRadius: 6,
                  padding: "8px",
                  border: `1px solid ${palette.secondary}22`,
                  fontSize: 15,
                }}
              />
              <button
                style={{
                  background: palette.accent,
                  border: "none",
                  color: "#fff",
                  borderRadius: 6,
                  marginLeft: 8,
                  padding: "8px 14px",
                  fontWeight: 600,
                  fontSize: 16,
                  cursor: "pointer",
                  transition: "background 0.2s",
                  boxShadow: "0 2px 3px #0002",
                }}
                onClick={handleNewNote}
                aria-label="New note"
                title="New note (Ctrl+N)"
              >
                ＋
              </button>
              {isMobile && (
                <button
                  aria-label="Close notes list"
                  style={{
                    background: "none",
                    border: "none",
                    color: palette.secondary,
                    marginLeft: 8,
                    fontSize: "1.3em",
                  }}
                  onClick={() => setShowSidebar(false)}
                >✕</button>
              )}
            </div>
            <div className="sidebar-list" style={{ flex: 1, overflowY: "auto", marginTop: 4 }}>
              <NoteList
                notes={filteredNotes()}
                selectedId={selectedId}
                onSelect={handleSelectNote}
                onDelete={handleDeleteNote}
              />
            </div>
            <div style={{ height: 8 }} />
          </aside>
        )}

        {/* Main/Right: Note Editor */}
        <section
          className="editor-pane"
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            marginLeft: isMobile && showSidebar ? "260px" : 0,
            minHeight: "calc(100vh - 52px)",
            background: "#87cbd9",
            zIndex: 1,
            color: "#b1e88c",
            textAlign: "left",
          }}
        >
          <form
            className="note-editor"
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              maxWidth: "700px",
              margin: "24px auto",
              padding: "0 18px",
            }}
            autoComplete="off"
            onSubmit={handleSaveNote}
          >
            {/* Title input */}
            <input
              className="title-input"
              type="text"
              placeholder="Title"
              aria-label="Note title"
              value={editorTitle}
              onChange={handleTitleChange}
              maxLength={64}
              required
              style={{
                border: "none",
                borderBottom: `2px solid ${palette.primary}`,
                padding: "14px 0",
                fontSize: "1.4em",
                fontWeight: 600,
                background: "none",
                color: "var(--text-primary)",
                marginBottom: 16,
                outline: "none",
                transition: "border-color 0.2s",
              }}
            />
            {/* Editor/textarea */}
            <textarea
              className="textarea"
              aria-label="Note"
              rows={isMobile ? 8 : 12}
              placeholder="Write your note here..."
              value={editorValue}
              onChange={handleEditorChange}
              style={{
                border: `1px solid ${palette.secondary}33`,
                borderRadius: 6,
                padding: 14,
                fontSize: "1.1875rem",
                resize: "vertical",
                color: "#e77913",
                background: "#f8fafd",
                minHeight: 180,
                marginBottom: 18,
                transition: "border 0.2s",
                outline: "none",
                fontFamily: "Georgia, serif",
                fontWeight: "normal",
                textAlign: "left",
              }}
            />
            <div
              className="note-footer"
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
              }}
            >
              <button
                type="button"
                onClick={handleNewNote}
                className="footer-btn secondary"
                style={{
                  background: "#eee",
                  color: palette.secondary,
                  border: "none",
                  borderRadius: 6,
                  padding: "8px 18px",
                  fontWeight: 600,
                  fontSize: 16,
                  letterSpacing: 1,
                  cursor: "pointer",
                  marginRight: 5,
                  transition: "background 0.15s",
                }}
                aria-label="New Note"
              >
                New
              </button>
              <button
                type="submit"
                className="footer-btn primary"
                style={{
                  background: palette.primary,
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  padding: "8px 25px",
                  fontWeight: 600,
                  fontSize: 16,
                  cursor: "pointer",
                  boxShadow: "0 2px 6px #0001",
                  transition: "background 0.15s",
                }}
                aria-label="Save"
              >
                {isNew ? "Create" : "Save"}
              </button>
            </div>
          </form>
          {/* Helper: if no notes and not creating */}
          {!isNew && !selectedId && !notes.length && (
            <div style={{ color: "#777", textAlign: "center", marginTop: "10vh", fontSize: "1.26em" }}>
              <div>No notes yet. Click <b>＋</b> to add a note!</div>
            </div>
          )}
        </section>
      </div>
      {/* Minimal footer */}
      <footer className="footer"
        style={{ textAlign: "center", padding: "10px 14px 6px", color: "#aaa", fontSize: 13, background: "#fafbfc" }}>
        Built with React &middot; Theme: <span style={{ color: palette.primary, fontWeight: 500 }}>Minimalist-Light</span>
      </footer>
    </div>
  );
}

export default App;
