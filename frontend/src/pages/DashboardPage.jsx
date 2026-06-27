import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const emptyBook = {
  title: "",
  author: "",
  isbn: "",
  category: "",
  quantity: 1,
};

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [books, setBooks] = useState([]);
  const [members, setMembers] = useState([]);
  const [borrowed, setBorrowed] = useState([]);
  const [bookForm, setBookForm] = useState(emptyBook);
  const [editId, setEditId] = useState(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const isLibrarian = user?.role === "librarian";

  const loadData = async () => {
    const requests = [api.get("/books", { params: search ? { search } : {} })];

    if (isLibrarian) {
      requests.push(api.get("/members"));
    } else {
      requests.push(api.get("/members/me/books"));
    }

    const [booksResponse, extraResponse] = await Promise.all(requests);
    setBooks(booksResponse.data.data || []);

    if (isLibrarian) {
      setMembers(extraResponse.data.data || []);
    } else {
      setBorrowed(extraResponse.data.data || []);
    }
  };

  useEffect(() => {
    loadData().catch((err) => setError(err?.response?.data?.message || "Failed to load dashboard"));
  }, [isLibrarian, search]);

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
    setError("");
    setStatus("");

    try {
      await api.delete(`/books/${id}`);
      setStatus("Book deleted successfully");
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to delete book");
    }
  };

  const borrowBook = async (id) => {
    setError("");
    setStatus("");

    try {
      await api.post(`/books/${id}/borrow`);
      setStatus("Borrow recorded successfully");
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to borrow book");
    }
  };

  const returnBook = async (id) => {
    setError("");
    setStatus("");

    try {
      await api.post(`/books/${id}/return`);
      setStatus("Book returned successfully");
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to return book");
    }
  };

  const visibleBooks = useMemo(() => books, [books]);

  return (
    <main className="dashboard-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Library dashboard</p>
          <h1>Welcome, {user?.name}</h1>
          <p className="subtle">Role: {user?.role}</p>
        </div>
        <div className="topbar-actions">
          <button className="secondary-button" onClick={loadData} type="button">
            Refresh
          </button>
          <button className="secondary-button" onClick={logout} type="button">
            Logout
          </button>
        </div>
      </header>

      <section className="stats-grid">
        <article className="stat-card">
          <span>Books in catalog</span>
          <strong>{books.length}</strong>
        </article>
        <article className="stat-card">
          <span>{isLibrarian ? "Registered members" : "Borrowed books"}</span>
          <strong>{isLibrarian ? members.length : borrowed.length}</strong>
        </article>
        <article className="stat-card">
          <span>{isLibrarian ? "Inventory control" : "Borrow/return ready"}</span>
          <strong>{isLibrarian ? "Admin" : "Member"}</strong>
        </article>
      </section>

      {error && <div className="alert error">{error}</div>}
      {status && <div className="alert success">{status}</div>}

      <section className="panel">
        <div className="panel-header">
          <h2>Books</h2>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search title, author, or ISBN" />
        </div>

        <div className="book-grid">
          {visibleBooks.map((book) => (
            <article className="book-card" key={book._id}>
              <div className="book-meta">
                <span>{book.category}</span>
                <strong>{book.availableQuantity}/{book.quantity} available</strong>
              </div>
              <h3>{book.title}</h3>
              <p>{book.author}</p>
              <small>ISBN {book.isbn}</small>

              {isLibrarian ? (
                <div className="card-actions">
                  <button type="button" onClick={() => {
                    setEditId(book._id);
                    setBookForm({
                      title: book.title,
                      author: book.author,
                      isbn: book.isbn,
                      category: book.category,
                      quantity: book.quantity,
                    });
                  }}>
                    Edit
                  </button>
                  <button type="button" onClick={() => deleteBook(book._id)}>
                    Delete
                  </button>
                </div>
              ) : (
                <div className="card-actions">
                  <button type="button" onClick={() => borrowBook(book._id)} disabled={book.availableQuantity <= 0}>
                    Borrow
                  </button>
                  <button type="button" onClick={() => returnBook(book._id)}>
                    Return
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      </section>

      {isLibrarian && (
        <section className="grid-two">
          <form className="panel form-panel" onSubmit={submitBook}>
            <h2>{editId ? "Update book" : "Add book"}</h2>
            <input value={bookForm.title} onChange={(event) => setBookForm({ ...bookForm, title: event.target.value })} placeholder="Title" />
            <input value={bookForm.author} onChange={(event) => setBookForm({ ...bookForm, author: event.target.value })} placeholder="Author" />
            <input value={bookForm.isbn} onChange={(event) => setBookForm({ ...bookForm, isbn: event.target.value })} placeholder="ISBN" />
            <input value={bookForm.category} onChange={(event) => setBookForm({ ...bookForm, category: event.target.value })} placeholder="Category" />
            <input type="number" min="0" value={bookForm.quantity} onChange={(event) => setBookForm({ ...bookForm, quantity: Number(event.target.value) })} placeholder="Quantity" />
            <div className="card-actions">
              <button className="primary-button" type="submit">{editId ? "Update" : "Create"}</button>
              {editId && <button type="button" onClick={resetForm}>Cancel</button>}
            </div>
          </form>

          <section className="panel">
            <h2>Members</h2>
            <div className="list-stack">
              {members.map((member) => (
                <article className="list-row" key={member._id}>
                  <div>
                    <strong>{member.name}</strong>
                    <p>{member.email}</p>
                  </div>
                  <span>{new Date(member.createdAt).toLocaleDateString()}</span>
                </article>
              ))}
            </div>
          </section>
        </section>
      )}

      {!isLibrarian && (
        <section className="panel">
          <h2>My borrowed books</h2>
          <div className="list-stack">
            {borrowed.map((record) => (
              <article className="list-row" key={record._id}>
                <div>
                  <strong>{record.bookId?.title}</strong>
                  <p>{record.bookId?.author}</p>
                </div>
                <span>{new Date(record.borrowDate).toLocaleDateString()}</span>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
