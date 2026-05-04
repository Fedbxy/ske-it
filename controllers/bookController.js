// Example

import { findAll } from "../models/bookModel.js";

export function getBookList(req, res) {
    const allBooks = findAll(); // Get data from Model
    res.render('books', { books: allBooks }); // Send data to View
}
