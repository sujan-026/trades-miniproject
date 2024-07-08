import express from 'express';
import bodyParser from "body-parser";
import mysql from "mysql";
import bcrypt from "bcrypt";
import session from "express-session";

const app = express();
const port = 3001;

// Set the view engine to EJS
app.set('view engine', 'ejs');

//Database connection
const db = mysql.createConnection({
    host: 'localhost',
    database: 'trial',
    user: 'root',
    password: 'Sujan@2004'
});

db.connect();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: true
}));

// Middleware for authentication
// const requireAuth = (req, res, next) => {
//     if (!req.session.userId || req.session.userRole !== 'dba') {
//         return res.redirect('/login');
//     }
//     next();
// };

app.get("/", (req, res) => {
    const query = `SELECT c.name AS country_name, 
                          p.name AS product_name, 
                          p.role, 
                          p.category
                   FROM Countries c
                   JOIN Products p ON c.country_id = p.country_id
                   WHERE p.category IN (SELECT DISTINCT category FROM Products)`;

    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).send('Database query error');
        }
        res.render("index.ejs", {
            categoryMsg: results,
            session: req.session
        });
    });
});

app.get('/index', (req, res) => {
    res.render('index', {
        categoryMsg: results,
        session: req.session
    });
});

app.get('/trades', (req, res) => {
    const firstQuery = `
        SELECT c.name AS country_name, 
               p.name AS product_name, 
               p.category, 
               p.role, 
               i.quantity, 
               i.import_date, 
               i.cost, 
               i.currency 
        FROM Imports i
        JOIN Products p ON i.product_id = p.product_id
        JOIN Countries c ON i.country_id = c.country_id
    `;

    const secondQuery = `
        SELECT c.name AS country_name, 
               p.name AS product_name, 
               p.role, 
               p.category
        FROM Countries c
        JOIN Products p ON c.country_id = p.country_id
    `;

    const thridQuery = `
    SELECT c.name AS country_name, 
               p.name AS product_name, 
               p.category, 
               p.role, 
               i.quantity, 
               i.export_date, 
               i.cost, 
               i.currency 
        FROM Exports i
        JOIN Products p ON i.product_id = p.product_id
        JOIN Countries c ON i.country_id = c.country_id
        `;

    db.query(firstQuery, (err, firstResults) => {
        if (err) {
            return res.status(500).send('Database query error for first table');
        }

        db.query(secondQuery, (err, secondResults) => {
            if (err) {
                return res.status(500).send('Database query error for second table');
            }

            db.query(thridQuery, (err, thirdResults) => {
                if (err) {
                    return res.status(500).send('Database query error for second table');
                }

                res.render('trades', {
                    firstTableMsg: firstResults,
                    secondTableMsg: secondResults,
                    thirdTableMsg: thirdResults
                });
            });
        });
    });
});

// Render login page
app.get('/login', (req, res) => {
    res.render('login');
});

// Render register page
app.get('/register', (req, res) => {
    res.render('register');
});

// Handle registration
app.post('/register', async (req, res) => {
    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = 'INSERT INTO users (username, password, role) VALUES (?, ?, ?)';

    db.query(query, [email, hashedPassword, 'dba'], (err, result) => {
        if (err) {
            console.error('Error registering user:', err);
            return res.status(500).send('Database error');
        }
        // Log the user in
        req.session.userId = result.insertId;
        req.session.userRole = 'dba';
        res.redirect('/dba');
    });
});

// Handle login
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const query = 'SELECT * FROM users WHERE username = ?';

    db.query(query, [email], async (err, results) => {
        if (err) {
            console.error('Error fetching user:', err);
            return res.status(500).send('Database error');
        }
        if (results.length === 0 || !(await bcrypt.compare(password, results[0].password))) {
            return res.status(401).send('Invalid email or password');
        }

        // Log the user in
        // console.log(req.session.userId = results[0].id);
        req.session.userRole = results[0].role;
        res.redirect('dba');
    });
});

// Protect DBA routes
const requireAuth = (req, res, next) => {
    if (req.session.userRole !== 'dba') {
        return res.redirect('/login');
    }
    next();
};

// Render DBA page
app.get('/dba', requireAuth, (req, res) => {
    res.render('dba');
});

// Handle adding country
app.post('/add-country', requireAuth, (req, res) => {
    const { countryName, isoCode } = req.body;
    const query = 'INSERT INTO Countries (name, iso_code) VALUES (?, ?)';

    db.query(query, [countryName, isoCode], (err, result) => {
        if (err) {
            console.error('Error inserting country:', err);
            return res.status(500).send('Database error');
        }
        res.redirect('/dba');
    });
});

// Handle deleting country
app.post('/delete-country', requireAuth, (req, res) => {
    const { countryId } = req.body;
    const query = 'DELETE FROM Countries WHERE country_id = ?';

    db.query(query, [countryId], (err, result) => {
        if (err) {
            console.error('Error deleting country:', err);
            return res.status(500).send('Database error');
        }
        res.redirect('/dba');
    });
});

// Handle adding product
app.post('/add-product', requireAuth, (req, res) => {
    const { productName, productCategory, countryId } = req.body;
    const query = 'INSERT INTO Products (name, category, country_id) VALUES (?, ?, ?)';

    db.query(query, [productName, productCategory, countryId], (err, result) => {
        if (err) {
            console.error('Error inserting product:', err);
            return res.status(500).send('Database error');
        }
        res.redirect('/dba');
    });
});

// Handle deleting product
app.post('/delete-product', requireAuth, (req, res) => {
    const { productId } = req.body;
    const query = 'DELETE FROM Products WHERE product_id = ?';

    db.query(query, [productId], (err, result) => {
        if (err) {
            console.error('Error deleting product:', err);
            return res.status(500).send('Database error');
        }
        res.redirect('/dba');
    });
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});