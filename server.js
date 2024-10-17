const express = require('express');
const app = express();


app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.use(express.static('public'));
app.engine("ejs",require("ejs").renderFile);
app.set("view engine","ejs");

app.get("/",(req,res)=>{
    res.render("home");
});

app.listen(3010, ()=>{
    console.log('Server is running on port 3010');
});