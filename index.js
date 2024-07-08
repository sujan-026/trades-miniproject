import express from 'express';
import bodyParser from "body-parser";
import mysql from "mysql";

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

app.get('/', (req, res) => {
    const query = `
    SELECT c.name AS country_name, 
           p.name AS product_name, 
           p.role, 
           p.category,
           pv.value, 
           pq.quantity 
    FROM Countries c
    JOIN Products p ON c.country_id = p.country_id
    LEFT JOIN ProductValues pv ON p.product_id = pv.product_id
    LEFT JOIN ProductQuantities pq ON p.product_id = pq.product_id
    WHERE p.category IN (SELECT DISTINCT category FROM Products)
`;

    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).send('Database query error');
        }
        res.render('index.ejs', {
            productMsg: results
        });
    });
});

app.get('/login', (req, res) => {
    res.render('login'); 
});

app.get('/index', (req, res) => {
    res.render('index'); 
});

app.get('/dba', (req, res) => {
    res.render('login'); 
});

app.get('/trades', (req, res) => {
    res.render('trades'); 
});

app.post("/dba", (req,res) => {
    // const countryName = req.body.countryName;
    // const countryIsocode = req.body.isoCode;
    // const productName = req.body.productName;
    // const productCategory = req.body.productCategory;
    // const productCountryId= req.body.countryId;
    // const productRoleImport = req.body.import.checked;
    // const productRoleExport = req.body.export.checked;
    // console.log(productRoleImport, productRoleExport);
    // const countryQuery = "INSERT INTO Countries (name, iso_code) VALUES (?, ?)";
    // const productQuery = "INSERT INTO Products (name, category, country_id) VALUES (?, ?, ?)";

    // db.query(countryQuery, [countryName, countryIsocode], (err, result) => {
    //     if (err) {
    //         console.error("Error inserting country:", err);
    //         return res.status(500).send("Database error");
    //     }
    //     res.redirect('/dba');
    // });

    // db.query(productQuery, [productName, productCategory, productCountryID], (err, result) => {
    //     if (err) {
    //         console.error("Error inserting country:", err);
    //         return res.status(500).send("Database error");
    //     }
    //     res.redirect('/dba');
    // });
    
    const productName = req.body.productName;
    const query = "INSERT INTO Products (name, category, country_id) VALUES (?)";
    db.query(query, [productName], (err, result) => {
        if (err) {
            console.error("Error inserting product:", err);
            return res.status(500).send("Database error");
        }
        res.redirect('/dba');
    });

})

app.listen(port, ()=>{
    console.log(`Listening on port ${port}`);
});