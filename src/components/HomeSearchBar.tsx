/**
 * Single-input search bar for the homepage hero. Posts as a GET to
 * /venues?q=<value>; VenuesListClient picks up the param via the new
 * `initialSearch` prop and pre-filters the listing.
 *
 * Intentionally a plain HTML form — no JS needed for the submit, no
 * autocomplete to ship. We can layer in autocomplete later without a
 * structural change.
 */
export default function HomeSearchBar() {
  return (
    <form
      action="/venues"
      method="get"
      className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto"
      role="search"
    >
      <label htmlFor="home-search" className="sr-only">
        Where in Florida?
      </label>
      <input
        id="home-search"
        type="text"
        name="q"
        placeholder="Where in Florida? (e.g. Miami, Key West, Palm Beach)"
        autoComplete="off"
        className="flex-1 px-5 py-3 rounded-lg bg-white/95 border border-white/30 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-400"
      />
      <button
        type="submit"
        className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold px-6 py-3 rounded-lg shadow-lg transition"
      >
        Search venues →
      </button>
    </form>
  );
}
