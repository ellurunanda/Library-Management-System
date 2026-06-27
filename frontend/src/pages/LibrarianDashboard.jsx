import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import "../styles/admin-dashboard.css";

const emptyBook = {
  title: "",
  author: "",
  isbn: "",
  category: "",
  quantity: 1,
};

export default function LibrarianDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("inventory");
  const [books, setBooks] = useState([]);
  const [members, setMembers] = useState([]);
  const [bookForm, setBookForm] = useState(emptyBook);
  const [editId, setEditId] = useState(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const loadData = async () => {
    try {
      const [booksRes, membersRes] = await Promise.all([
        api.get("/books", { params: search ? { search } : {} }),
        api.get("/members"),
      ]);
      setBooks(booksRes.data.data || []);
      setMembers(membersRes.data.data || []);
      setError("");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load data");
    }
  };

  useEffect(() => {
    loadData();
  }, [search]);

  const resetForm = () => {
    setBookForm(emptyBook);
    setEditId(null);
  };

  const submitBook = async (event) => {
    event.preventDefault();
    setError("");
    setStatus("");

    try {
      if (editId) {
        await api.put(`/books/${editId}`, bookForm);
        setStatus("Book updated successfully");
      } else {
        await api.post("/books", bookForm);
        setStatus("Book created successfully");
      }
      resetForm();
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to save book");
    }
  };

  const deleteBook = async (id) => {
    if (window.confirm("Are you sure you want to delete this book?")) {
      setError("");
      setStatus("");

      try {
        await api.delete(`/books/${id}`);
        setStatus("Book deleted successfully");
        await loadData();
      } catch (err) {
        setError(err?.response?.data?.message || "Unable to delete book");
      }
    }
  };

  const totalBooks = books.reduce((sum, b) => sum + b.quantity, 0);
  const totalAvailable = books.reduce((sum, b) => sum + b.availableQuantity, 0);
  const totalBorrowed = totalBooks - totalAvailable;

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <h2>📚 Library Admin</h2>
          <p className="user-info">{user?.name}</p>
        </div>
        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeTab === "inventory" ? "active" : ""}`}
            onClick={() => setActiveTab("inventory")}
          >
            📖 Inventory
          </button>
          <button
            className={`nav-item ${activeTab === "members" ? "active" : ""}`}
            onClick={() => setActiveTab("members")}
          >
            👥 Members
          </button>
          <button
            className={`nav-item ${activeTab === "add-book" ? "active" : ""}`}
            onClick={() => setActiveTab("add-book")}
          >
            ➕ Add Book
          </button>
        </nav>
        <div className="sidebar-footer">
          <button className="logout-button" onClick={logout}>
            🚪 Logout
          </button>
        </div>
      </aside>

      <main className="admin-content">
        <header className="admin-topbar">
          <h1>Library Management System</h1>
          <button className="refresh-button" onClick={loadData} type="button">
            🔄 Refresh
          </button>
        </header>

        <section className="stats-grid-admin">
          <div className="stat-card-admin">
            <span className="stat-label">Total Books</span>
            <strong className="stat-value">{books.length}</strong>
            <p className="stat-subtext">{totalBooks} copies</p>
          </div>
          <div className="stat-card-admin">
            <span className="stat-label">Available</span>
            <strong className="stat-value">{totalAvailable}</strong>
            <p className="stat-subtext">Ready to borrow</p>
          </div>
          <div className="stat-card-admin">
            <span className="stat-label">Borrowed</span>
            <strong className="stat-value">{totalBorrowed}</strong>
            <p className="stat-subtext">Currently out</p>
          </div>
          <div className="stat-card-admin">
            <span className="stat-label">Members</span>
            <strong className="stat-value">{members.length}</strong>
            <p className="stat-subtext">Registered users</p>
          </div>
        </section>

        {error && <div className="alert error">{error}</div>}
        {status && <div className="alert success">{status}</div>}

        {activeTab === "inventory" && (
          <section className="panel-full">
            <div className="panel-header">
              <h2>📚 Book Inventory</h2>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by title, author, or ISBN..."
                className="search-input"
              />
            </div>

            <div className="table-responsive">
              <table className="inventory-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Author</th>
                    <th>ISBN</th>
                    <th>Category</th>
                    <th>Total</th>
                    <th>Available</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {books.map((book) => (
                    <tr key={book._id} className="table-row">
                      <td className="book-title">{book.title}</td>
                      <td>{book.author}</td>
                      <td className="isbn">{book.isbn}</td>
                      <td className="category">{book.category}</td>
                      <td className="text-center">{book.quantity}</td>
                      <td className="text-center">
                        <span className={`availability ${book.availableQuantity > 0 ? "available" : "unavailable"}`}>
                          {book.availableQuantity}
                        </span>
                      </td>
                      <td className="actions">
                        <button
                          className="btn-edit"
                          onClick={() => {
                            setActiveTab("add-book");
                            setEditId(book._id);
                            setBookForm({
                              title: book.title,
                              author: book.author,
                              isbn: book.isbn,
                              category: book.category,
                              quantity: book.quantity,
                            });
                          }}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          className="btn-delete"
                          onClick={() => deleteBook(book._id)}
                        >
                          🗑️ Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {books.length === 0 && <p className="empty-state">No books found. Add one to get started!</p>}
          </section>
        )}

        {activeTab === "members" && (
          <section className="panel-full">
            <div className="panel-header">
              <h2>👥 Member Management</h2>
              <div className="member-stats">
                <span>Total Members: <strong>{members.length}</strong></span>
              </div>
            </div>

            <div className="members-grid">
              {members.map((member) => (
                <article className="member-card" key={member._id}>
                  <div className="member-header">
                    <h3>{member.name}</h3>
                    <span className="member-role">👤 Member</span>
                  </div>
                  <div className="member-details">
                    <p>
                      <strong>Email:</strong> {member.email}
                    </p>
                    <p>
                      <strong>Joined:</strong> {new Date(member.createdAt).toLocaleDateString()}
                    </p>
                    <p>
                      <strong>Status:</strong> <span className="status-active">Active</span>
                    </p>
                  </div>

                  {member.borrowedBooks && member.borrowedBooks.length > 0 && (
                    <div className="member-borrowed-books">
                      <strong>📚 Borrowed Books ({member.borrowedBooks.length}):</strong>
                      <ul className="borrowed-list">
                        {member.borrowedBooks.map((borrow) => (
                          <li key={borrow._id}>
                            <span className="book-title">{borrow.bookId?.title}</span>
                            <span className="borrow-date">{new Date(borrow.borrowDate).toLocaleDateString()}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {(!member.borrowedBooks || member.borrowedBooks.length === 0) && (
                    <div className="no-borrowed">
                      <p>No borrowed books</p>
                    </div>
                  )}
                </article>
              ))}
            </div>

            {members.length === 0 && <p className="empty-state">No members registered yet.</p>}
          </section>
        )}

        {activeTab === "add-book" && (
          <section className="panel-full max-width">
            <div className="panel-header">
              <h2>{editId ? "✏️ Update Book" : "➕ Add New Book"}</h2>
            </div>

            <form className="book-form" onSubmit={submitBook}>
              <div className="form-group">
                <label>Title *</label>
                <input
                  required
                  value={bookForm.title}
                  onChange={(event) => setBookForm({ ...bookForm, title: event.target.value })}
                  placeholder="Enter book title"
                />
              </div>

              <div className="form-group">
                <label>Author *</label>
                <input
                  required
                  value={bookForm.author}
                  onChange={(event) => setBookForm({ ...bookForm, author: event.target.value })}
                  placeholder="Enter author name"
                />
              </div>

              <div className="form-group">
                <label>ISBN *</label>
                <input
                  required
                  value={bookForm.isbn}
                  onChange={(event) => setBookForm({ ...bookForm, isbn: event.target.value })}
                  placeholder="Enter ISBN"
                />
              </div>

              <div className="form-group">
                <label>Category *</label>
                <input
                  required
                  value={bookForm.category}
                  onChange={(event) => setBookForm({ ...bookForm, category: event.target.value })}
                  placeholder="e.g., Fiction, Science, History"
                />
              </div>

              <div className="form-group">
                <label>Quantity *</label>
                <input
                  required
                  type="number"
                  min="1"
                  value={bookForm.quantity}
                  onChange={(event) => setBookForm({ ...bookForm, quantity: Number(event.target.value) })}
                  placeholder="Number of copies"
                />
              </div>

              <div className="form-actions">
                <button className="btn-submit" type="submit">
                  {editId ? "💾 Update Book" : "➕ Add Book"}
                </button>
                {editId && (
                  <button
                    className="btn-cancel"
                    type="button"
                    onClick={resetForm}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </section>
        )}
      </main>
    </div>
  );
}
