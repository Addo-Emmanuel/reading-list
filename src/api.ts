export type Status = "Want to read" | "Reading" | "Done";

export interface Book {
  id: number;
  title: string;
  author: string;
  status: Status;
  rating: number;
}

const BASE_URL = "http://localhost:3001";

// Query key factory
export const bookKeys = {
  all: ["books"] as const,
  detail: (id: number) => ["books", id] as const,
};

// Helper to make requests and attach x-fail header if simulateError is true
async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  simulateError = false,
): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");

  if (simulateError) {
    headers.set("x-fail", "true");
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Important: fetch doesn't throw on HTTP errors (404, 500)
  // We must throw manually so useMutation triggers onError
  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const message = errorBody?.error || `Server error (${response.status})`;
    throw new Error(message);
  }

  // Handle empty responses (like 204 or DELETE)
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

// 1. Read all books (GET /books)
export async function getBooks(): Promise<Book[]> {
  const response = await fetch(`${BASE_URL}/books`);
  if (!response.ok) {
    throw new Error(`Failed to load books (${response.status})`);
  }
  return response.json();
}

// 2. Add a book (POST /books)
export async function createBook(
  book: { title: string; author: string; status: Status; rating: number },
  simulateError = false,
): Promise<Book> {
  return request<Book>(
    "/books",
    {
      method: "POST",
      body: JSON.stringify(book),
    },
    simulateError,
  );
}

// 3. Update book status (PATCH /books/:id)
export async function updateStatus(
  id: number,
  status: Status,
  simulateError = false,
): Promise<Book> {
  return request<Book>(
    `/books/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify({ status }),
    },
    simulateError,
  );
}

// 4. Rate a book (PATCH /books/:id)
export async function updateRating(
  id: number,
  rating: number,
  simulateError = false,
): Promise<Book> {
  return request<Book>(
    `/books/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify({ rating }),
    },
    simulateError,
  );
}

// 5. Delete a book (DELETE /books/:id)
export async function deleteBook(
  id: number,
  simulateError = false,
): Promise<void> {
  return request<void>(
    `/books/${id}`,
    {
      method: "DELETE",
    },
    simulateError,
  );
}
