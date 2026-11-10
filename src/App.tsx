import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  type Book,
  type Status,
  bookKeys,
  getBooks,
  createBook,
  updateStatus,
  updateRating,
  deleteBook,
} from "./api";
import "./App.css";

const STATUSES: Status[] = ["Want to read", "Reading", "Done"];

// Clickable Star component for ratings (0 to 5)
function Star({
  filled,
  onClick,
  disabled,
}: {
  filled: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`text-xl leading-none ${
        disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
      } ${filled ? "text-amber-400" : "text-gray-300"}`}
      aria-label={filled ? "filled star" : "empty star"}
    >
      {filled ? "★" : "☆"}
    </button>
  );
}

function App() {
  const queryClient = useQueryClient();

  // Form input state (local component state)
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");

  // Stage 5: Simulate server errors switch (page state, not server data)
  const [simulateErrors, setSimulateErrors] = useState(false);

  // Simple feedback toast state
  const [toast, setToast] = useState<{
    title: string;
    description?: string;
    isError?: boolean;
  } | null>(null);

  const showToast = (title: string, description?: string, isError = false) => {
    setToast({ title, description, isError });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // --- QUERY: Read books from server ---
  const {
    data: books = [],
    isLoading,
    isError: isLoadError,
    error: loadError,
  } = useQuery({
    queryKey: bookKeys.all,
    queryFn: getBooks,
  });

  // --- STAGE 1: Add a book (refetch after success) ---
  const addBookMutation = useMutation({
    mutationFn: (newBook: { title: string; author: string; status: Status; rating: number }) =>
      createBook(newBook, simulateErrors),
    onSuccess: (savedBook) => {
      // Invalidate the query so the list reloads from the server
      queryClient.invalidateQueries({ queryKey: bookKeys.all });
      // Clear form inputs
      setTitle("");
      setAuthor("");
      showToast("Book added", `"${savedBook.title}" was added to your list.`);
    },
    onError: (err) => {
      showToast("Could not add book", err.message, true);
    },
  });

  const handleAddBook = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    addBookMutation.mutate({
      title: trimmedTitle,
      author: author.trim() || "Unknown author",
      status: "Want to read",
      rating: 0,
    });
  };

  // --- STAGE 2: Change status (update with a refetch) ---
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: Status }) =>
      updateStatus(id, status, simulateErrors),
    onSuccess: () => {
      // Invalidate the list after updating
      queryClient.invalidateQueries({ queryKey: bookKeys.all });
      showToast("Status updated");
    },
    onError: (err) => {
      showToast("Could not update status", err.message, true);
    },
  });

  // --- STAGE 3: Remove a book (optimistic update with rollback) ---
  const removeBookMutation = useMutation({
    mutationFn: (id: number) => deleteBook(id, simulateErrors),
    onMutate: async (id: number) => {
      // 1. Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: bookKeys.all });

      // 2. Snapshot the current books list
      const previousBooks = queryClient.getQueryData<Book[]>(bookKeys.all);

      // 3. Optimistically remove the book from the cache immediately
      if (previousBooks) {
        queryClient.setQueryData<Book[]>(
          bookKeys.all,
          previousBooks.filter((b) => b.id !== id)
        );
      }

      // Return context containing the previous books snapshot
      return { previousBooks };
    },
    onError: (_err, id, context) => {
      // Rollback: restore the saved list
      if (context?.previousBooks) {
        queryClient.setQueryData(bookKeys.all, context.previousBooks);
      }
      const book = context?.previousBooks?.find((b) => b.id === id);
      const bookTitle = book ? book.title : "this book";
      showToast(`Could not remove "${bookTitle}"`, "It was restored to your list.", true);
    },
    onSettled: () => {
      // Always refetch after error or success to ensure server and client match
      queryClient.invalidateQueries({ queryKey: bookKeys.all });
    },
    onSuccess: () => {
      showToast("Book removed");
    },
  });

  // --- STAGE 4: Rate a book (optimistic update on one field) ---
  const rateBookMutation = useMutation({
    mutationFn: ({ id, rating }: { id: number; rating: number }) =>
      updateRating(id, rating, simulateErrors),
    onMutate: async ({ id, rating }) => {
      // 1. Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: bookKeys.all });

      // 2. Snapshot the current books list
      const previousBooks = queryClient.getQueryData<Book[]>(bookKeys.all);

      // 3. Optimistically change the rating of the specific book in the cache
      if (previousBooks) {
        queryClient.setQueryData<Book[]>(
          bookKeys.all,
          previousBooks.map((b) => (b.id === id ? { ...b, rating } : b))
        );
      }

      return { previousBooks };
    },
    onError: (_err, _variables, context) => {
      // Rollback: restore previous list
      if (context?.previousBooks) {
        queryClient.setQueryData(bookKeys.all, context.previousBooks);
      }
      showToast("Could not save rating", "Restored previous rating.", true);
    },
    onSettled: () => {
      // Invalidate to sync with server
      queryClient.invalidateQueries({ queryKey: bookKeys.all });
    },
  });

  return (
    <div className="min-h-screen bg-stone-100 p-10 font-sans text-slate-800">
      <div className="mx-auto max-w-3xl">
        {/* Header with App Title and Error Switch */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="font-bold text-3xl">Page Turner</h1>
            <p className="text-sm text-gray-600">Your reading list. Sample data for a practice project.</p>
          </div>

          {/* Stage 5: Simulate server errors switch */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Simulate server errors</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={simulateErrors}
                onChange={(e) => setSimulateErrors(e.target.checked)}
              />
              <div className="w-12 h-6 bg-slate-300 rounded-full peer-checked:bg-blue-600 transition-colors duration-200"></div>
              <span className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 ease-in-out peer-checked:translate-x-6"></span>
            </label>
          </div>
        </div>

        {/* Stage 1: Add book form */}
        <div className="mt-6 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <form onSubmit={handleAddBook}>
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <label className="block text-xs font-semibold mb-1 text-gray-700">Title</label>
                <input
                  className="w-full border border-gray-300 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  type="text"
                  placeholder="The Salt Road"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (addBookMutation.isError) addBookMutation.reset();
                  }}
                />
              </div>

              <div className="flex-1">
                <label className="block text-xs font-semibold mb-1 text-gray-700">Author</label>
                <input
                  className="w-full border border-gray-300 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  type="text"
                  placeholder="Add an author"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={addBookMutation.isPending || !title.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-semibold text-sm py-2.5 px-5 rounded-lg transition-colors cursor-pointer"
              >
                {addBookMutation.isPending ? "Adding..." : "Add book"}
              </button>
            </div>

            {/* Error message under the form if mutation fails */}
            {addBookMutation.isError && (
              <p className="text-xs text-red-600 mt-2 font-medium">
                {addBookMutation.error.message || "Failed to add book. Please try again."}
              </p>
            )}
          </form>
        </div>

        {/* Books list section */}
        <div className="mt-4 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-semibold text-base">My books</h2>
            <span className="text-xs text-gray-500">
              {books.length} {books.length === 1 ? "book" : "books"}
            </span>
          </div>

          {isLoading && (
            <p className="text-sm text-gray-500 py-6 text-center">Loading your books...</p>
          )}

          {isLoadError && (
            <div className="py-4 text-center">
              <p className="text-sm text-red-600 font-medium">Error loading books from server.</p>
              <p className="text-xs text-gray-500 mt-1">{loadError.message}</p>
              <p className="text-xs text-gray-400 mt-2">
                Make sure the fake API is running: <code className="bg-gray-100 px-1 py-0.5 rounded">npm run api</code>
              </p>
            </div>
          )}

          {!isLoading && !isLoadError && books.length === 0 && (
            <p className="text-sm text-gray-500 py-6 text-center">
              No books yet. Add your first one above.
            </p>
          )}

          {!isLoading && !isLoadError && books.length > 0 && (
            <ul>
              {books.map((book) => {
                // Stage 2: Only the row being changed is disabled while pending
                const isStatusPending =
                  updateStatusMutation.isPending &&
                  updateStatusMutation.variables?.id === book.id;

                const isRowDisabled = isStatusPending;

                return (
                  <li
                    key={book.id}
                    className={`flex items-center gap-4 py-4 border-b border-gray-200 last:border-b-0 transition-opacity ${
                      isRowDisabled ? "opacity-60" : "opacity-100"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{book.title}</p>
                      <p className="text-xs text-gray-500 truncate">{book.author}</p>
                    </div>

                    {/* Stage 2: Status dropdown */}
                    <select
                      value={book.status}
                      disabled={isRowDisabled}
                      onChange={(e) =>
                        updateStatusMutation.mutate({
                          id: book.id,
                          status: e.target.value as Status,
                        })
                      }
                      className="border border-gray-300 rounded-lg py-2 px-3 text-sm w-36 bg-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>

                    {/* Stage 4: 5 clickable stars for rating */}
                    <div className="flex gap-0.5 w-28 items-center">
                      {[1, 2, 3, 4, 5].map((starValue) => (
                        <Star
                          key={starValue}
                          filled={starValue <= book.rating}
                          disabled={isRowDisabled}
                          onClick={() => {
                            // Toggle off to 0 if clicking the current rating, otherwise set to starValue
                            const nextRating = book.rating === starValue ? 0 : starValue;
                            rateBookMutation.mutate({ id: book.id, rating: nextRating });
                          }}
                        />
                      ))}
                    </div>

                    {/* Stage 3: Remove button */}
                    <button
                      type="button"
                      onClick={() => removeBookMutation.mutate(book.id)}
                      disabled={isRowDisabled}
                      className="w-24 py-2 rounded-lg text-sm font-semibold border text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Remove
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <p className="text-xs text-gray-500 mt-4 pt-3 border-t border-gray-100">
            TanStack Query mutations handle server changes with refetching and optimistic updates.
          </p>
        </div>
      </div>

      {/* Stage 5: Floating Toast Feedback */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-xl shadow-2xl border border-slate-700 max-w-xs animate-in fade-in slide-in-from-bottom-2 duration-200">
          <p className="font-semibold text-sm text-white">{toast.title}</p>
          {toast.description && (
            <p className="text-gray-300 mt-1 leading-relaxed">{toast.description}</p>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
