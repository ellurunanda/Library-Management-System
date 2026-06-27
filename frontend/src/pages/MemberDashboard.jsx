import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import "../styles/member-dashboard.css";

export default function MemberDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("available");
  const [books, setBooks] = useState([]);
  const [borrowed, setBorrowed] = useState([]);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 350);

    return () => clearTimeout(timeoutId);
  }, [search]);

  const loadData = async () => {
    try {
      const [booksRes, borrowedRes] = await Promise.all([
        api.get("/books", { params: debouncedSearch ? { search: debouncedSearch } : {} }),
        api.get("/members/me/books"),
      ]);
      setBooks(booksRes.data.data || []);
      setBorrowed(borrowedRes.data.data || []);
      setError("");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load data");
    }
  };

  useEffect(() => {
    loadData();
  }, [debouncedSearch]);

  const borrowBook = async (bookId) => {
    setError("");
    setStatus("");

    try {
      await api.post(`/books/${bookId}/borrow`);
      setStatus("Book borrowed successfully!");
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to borrow book");
    }
  };

  const returnBook = async (recordId) => {
    setError("");
    setStatus("");

    try {
      await api.post(`/books/${recordId}/return`);
      setStatus("Book returned successfully!");
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to return book");
    }
  };

  const totalBorrowed = borrowed.length;
  const availableBooks = books.filter((b) => b.availableQuantity > 0).length;

  return (
    <div className="member-shell">
      <aside className="member-sidebar">
        <div className="sidebar-header">
          <h2>📚 Library</h2>
          <p className="user-info">{user?.name}</p>
        </div>
        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeTab === "available" ? "active" : ""}`}
            onClick={() => setActiveTab("available")}
          >
            📖 Available Books
          </button>
          <button
            className={`nav-item ${activeTab === "borrowed" ? "active" : ""}`}
            onClick={() => setActiveTab("borrowed")}
          >
            📕 My Books ({totalBorrowed})
          </button>
        </nav>
        <div className="sidebar-footer">
          <button className="logout-button" onClick={logout}>
            🚪 Logout
          </button>
        </div>
      </aside>

      <main className="member-content">
        <header className="member-topbar">
          <div>
            <h1>Welcome, {user?.name}! 👋</h1>
            <p className="subtitle">Explore and manage your library books</p>
          </div>
          <button className="refresh-button" onClick={loadData}>
            🔄 Refresh
          </button>
        </header>

        <section className="stats-grid-member">
          <div className="stat-card-member">
            <span className="stat-emoji">📖</span>
            <div className="stat-content">
              <span className="stat-label">Available Books</span>
              <strong className="stat-value">{availableBooks}</strong>
            </div>
          </div>
          <div className="stat-card-member">
            <span className="stat-emoji">📕</span>
            <div className="stat-content">
              <span className="stat-label">My Books</span>
              <strong className="stat-value">{totalBorrowed}</strong>
            </div>
          </div>
          <div className="stat-card-member">
            <span className="stat-emoji">📚</span>
            <div className="stat-content">
              <span className="stat-label">Total Catalog</span>
              <strong className="stat-value">{books.length}</strong>
            </div>
          </div>
        </section>

        {error && <div className="alert error">{error}</div>}
        {status && <div className="alert success">{status}</div>}

        {activeTab === "available" && (
          <section className="panel-full">
            <div className="panel-header">
              <h2>📖 Available Books</h2>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by title, author, or ISBN..."
                className="search-input"
              />
            </div>

            <div className="books-grid-member">
              {books.map((book) => (
                <article className="book-card-member" key={book._id}>
                  <div className="book-header-member">
                    <h3>{book.title}</h3>
                    <span className={`availability-badge ${book.availableQuantity > 0 ? "available" : "unavailable"}`}>
                      {book.availableQuantity > 0 ? "Available" : "Out of Stock"}
                    </span>
                  </div>

                  <div className="book-meta-member">
                    <p>
                      <strong>Author:</strong> {book.author}
                    </p>
                    <p>
                      <strong>Category:</strong> {book.category}
                    </p>
                    <p>
                      <strong>ISBN:</strong> {book.isbn}
                    </p>
                    <p className="copies-info">
                      <strong>{book.availableQuantity}</strong> of {book.quantity} copies available
                    </p>
                  </div>

                  <button
                    className="btn-borrow"
                    onClick={() => borrowBook(book._id)}
                    disabled={book.availableQuantity <= 0}
                  >
                    {book.availableQuantity > 0 ? "📖 Borrow" : "Out of Stock"}
                  </button>
                </article>
              ))}
            </div>

            {books.length === 0 && <p className="empty-state">No books found matching your search.</p>}
          </section>
        )}

        {activeTab === "borrowed" && (
          <section className="panel-full">
            <div className="panel-header">
              <h2>📕 My Borrowed Books</h2>
              <div className="borrow-stats">
                <span>Total Borrowed: <strong>{totalBorrowed}</strong></span>
              </div>
            </div>

            <div className="borrowed-list">
              {borrowed.length > 0 ? (
                borrowed.map((record) => (
                  <article className="borrowed-card" key={record._id}>
                    {!record.bookId ? (
                      <div className="deleted-book-notice">
                        <p className="deleted-title">⚠️ Book Deleted from Library</p>
                        <p className="deleted-message">This book has been removed from the library inventory.</p>
                        <p className="deleted-subtext">Borrow Date: {new Date(record.borrowDate).toLocaleDateString()}</p>
                        {!record.returnDate && (
                          <button
                            className="btn-return"
                            onClick={() => returnBook(record._id)}
                          >
                            📤 Return Borrow Record
                          </button>
                        )}
                        {record.returnDate && (
                          <span className="returned-badge">✓ Returned</span>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="borrowed-header">
                          <div className="borrowed-info">
                            <h3>{record.bookId?.title}</h3>
                            <p className="author">by {record.bookId?.author}</p>
                          </div>
                          <span className="borrow-date">
                            Borrowed on: {new Date(record.borrowDate).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="borrowed-meta">
                          <div className="meta-item">
                            <span className="label">Category:</span>
                            <span className="value">{record.bookId?.category}</span>
                          </div>
                          <div className="meta-item">
                            <span className="label">ISBN:</span>
                            <span className="value">{record.bookId?.isbn}</span>
                          </div>
                          {record.returnDate && (
                            <div className="meta-item">
                              <span className="label">Returned on:</span>
                              <span className="value">{new Date(record.returnDate).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>

                        {!record.returnDate && (
                          <button
                            className="btn-return"
                            onClick={() => returnBook(record._id)}
                          >
                            📤 Return Book
                          </button>
                        )}
                        {record.returnDate && (
                          <span className="returned-badge">✓ Returned</span>
                        )}
                      </>
                    )}
                  </article>
                ))
              ) : (
                <p className="empty-state">
                  You haven't borrowed any books yet. Browse available books to get started! 📚
                </p>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
