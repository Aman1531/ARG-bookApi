const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const TOKEN_SECRET='09f26e402586e2faa8da4c98a35f1b20d6b033c6097befa8be3486a829587fe2f90a832bd3ff9d42710a4da095a2ce285b009f0c3730cd9b8e1af3eb84df6611'
const JSONdb = require('simple-json-db');
const db = new JSONdb('./storage.json');

function generateAccessToken() {
    return jwt.sign({name:'admin'}, TOKEN_SECRET, { expiresIn: '60000' });
  }
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (authHeader) {
        const token = JSON.parse(authHeader.split(' ')[1]);
        
        jwt.verify(token, TOKEN_SECRET, (err, user) => {
            if (err) {
                return res.sendStatus(403);
            }

            req.user = user;
            next();
        });
    } else {
        res.sendStatus(401);
    }
};

/* Book data fields : *title , *author , publisher , no_of_pages , description  
Title and Author are compulsory , rest optional 
*/

router.get('/authorize', function(req, res, next) {
  const token = generateAccessToken();
  res.json(token)  
});

router.post('/save', authenticateJWT, (req,res) => {
  let index;
  if(db.has('index'))
    index = db.get('index')
  else
    index = 0

  if ( 'title' in req.body && 'author' in req.body) {
  db.set(index.toString(),JSON.stringify(req.body))
  db.set('index',index+1)
  res.send("Book saved at index: "+ index)
  }
  else
  res.status(400).send("Bad request")


})

router.get('/get',authenticateJWT,(req,res) => {
  let books = db.JSON()
  let result = []

  let searchBy = ""
  if( 'author' in req.query )
      searchBy = "author"
  else if('publisher' in req.query)
    searchBy = "publisher"
 
     if(searchBy.length) 
      for (const book in books) {
       let b = JSON.parse(books[book])
       if( b[searchBy] === req.query[searchBy])
        result.push(b)
      }
      else 
      result = books

    res.send(result)
})

router.get('/delete/:id',authenticateJWT,(req,res) => {
  let books = db.JSON()
  if( req.params.id in books) {
    delete books[req.params.id]
    db.JSON(books)
    res.send(books)
  }
  else
   res.send("Book Not found")

})

module.exports = router;
