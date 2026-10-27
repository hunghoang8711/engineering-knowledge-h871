const form = document.querySelector("#search-form");
const input = document.querySelector("#global-search");
const message = document.querySelector("#search-message");

form?.addEventListener("submit", (event) => {
  event.preventDefault();
  const query = input?.value?.trim();
  message.textContent = query
    ? "Search is not connected yet. No data was sent or stored. Database and secure search will be implemented in a later phase."
    : "Enter a keyword to prepare a search. Search will be enabled after the data source is connected.";
});
