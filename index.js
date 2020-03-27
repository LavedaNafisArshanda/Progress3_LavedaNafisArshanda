const express = require('express')
const bodyParser = require('body-parser')
const mysql = require('mysql')
const jwt = require('jsonwebtoken')

const app = express()


const secretKey = 'thisisverysecretkey'

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
  extended: true
}))

const db = mysql.createConnection({
  host:'127.0.0.1',
  port:'3306',
  user:'root',
  password:'',
  database:"coronatimes"
})

db.connect((err) => {
  if (err){
    throw err
  }else{
    console.log("Database connected")
  }

})

const isAuthorized = (request, result, next)=> {
  if(typeof(request.headers['x-api-key']) == 'undefined'){
    return result.status(403).json({
      success: false,
      message: 'Unauthorized. Token is not provided'
    })
  }

  let token = request.headers['x-api-key']

  jwt.verify(token, secretKey, (err, decoded)=>{
    if (err) {
      return result.status(401),json({
        success: false,
        message:'Unauthorized. Token is invalid'
      })
    }
  })

  next()
}


app.get('/',(request,result) =>{
  result.json({
    success: true,
    message: 'Welcome'
  })
})

app.post('/login',(request,result)=>{
  let data = request.body

  if(data.username == 'admin' && data.password == 'admin'){
    let token = jwt.sign(data.username + '|' + data.password, secretKey)

    result.json({
      success: true,
      message:'Login succes, Welcome back!',
      token: token
    })
  }

  result.json({
    success: false,
    message: 'Kamu bukan orangnya yaa?!'
  })
})

//////////   CRUD BARANG    /////////////
app.get('/barang', isAuthorized, (req, res) => {
  let sql = `
  select * from barang
  `

  db.query(sql,(err, result) => {
    if(err) throw  err

    res.json({
      success: true,
      message: 'Success retrive data from database',
      data: result
    })
  })
})

app.post('/barang', isAuthorized, (request, result) => {
  let data = request.body

  let sql = `
      insert into barang(id_barang, nama_barang, merk, stok)
      values ('`+data.id_barang+`', '`+data.nama_barang+`', '`+data.merk+`', '`+data.stok+`');
  `

  db.query(sql, (err, result) => {
    if (err) throw err
  })

  result.json({
    success: true,
    message: 'Barang kamu sudah ready:)'
  })
})

app.put('/barang/:id', isAuthorized, (request, result) => {
  let data = request.body

  let sql = `
      update barang
      set id_barang = '`+data.id_barang+`', nama_barang = '`+data.nama_barang+`', merk = '`+data.merk+`', stok = '`+data.stok+`'
      where id_barang = `+request.params.id+`
      `

  db.query(sql, (err, result) => {
    if (err) throw err
  })

  result.json({
    success: true,
    message: 'Data has been updated'
  })
})

app.delete('/barang/:id', isAuthorized, (request, result) => {
  let sql = `
      delete from barang where id_barang = `+request.params.id+`
  `

  db.query(sql, (err, res) => {
    if(err) throw err
  })

  result.json({
    success: true,
    message: 'Data has been deleted'
  })
})


//////////   CRUD CUSTOMER   /////////////
app.get('/customer', isAuthorized, (req, res) => {
  let sql = `
  select * from customer 
  `

  db.query(sql,(err, result) => {
    if(err) throw  err

    res.json({
      success: true,
      message: 'Success retrive data from database',
      data: result
    })
  })
})

app.post('/customer', isAuthorized, (request, result) => {
  let data = request.body

  let sql = `
      insert into customer(id_customer, nama_customer, no_tlp, alamat)
      values ('`+data.id_customer+`', '`+data.nama_customer+`', '`+data.no_tlp+`', '`+data.alamat+`');
  `

  db.query(sql, (err, result) => {
    if (err) throw err
  })

  result.json({
    success: true,
    message: 'Selamat data kamu sudah terdaftar'
  })
})

app.put('/customer/:id', isAuthorized, (request, result) => {
  let data = request.body

  let sql = `
      update customer
      set id_customer = '`+data.id_customer+`', nama_customer = '`+data.nama_customer+`', no_tlp = '`+data.no_tlp+`', alamat = '`+data.alamat+`'
      where id_customer = `+request.params.id+`
      `

  db.query(sql, (err, result) => {
    if (err) throw err
  })

  result.json({
    success: true,
    message: 'Datamu sudah di updated'
  })
})

app.delete('/customer/:id', isAuthorized, (request, result) => {
  let sql = `
      delete from customer where id_customer = `+request.params.id+`
  `

  db.query(sql, (err, res) => {
    if(err) throw err
  })

  result.json({
    success: true,
    message: 'Your data has been deleted'
  })
})

///// Transaksi //////
app.post('/barang/:id/take', (req, res) => {
  let data = req.body

  db.query(`
    insert into transaksi (id_customer, id_barang)
    values ('`+data.id_customer+`', '`+req.params.id+`')
    `, (err, result) => {
      if (err) throw err
    })

  db.query(`
    update barang
    set jumlah = jumlah - 1
    where id_barang = '`+req.params.id+`'
    `, (err, result) => {
      if (err) throw err
    })

    res.json({
      message: "barangmu sudah terpesan horray"
    })
})

app.get('/customer/:id/barang', (req, res) => {
    db.query(`
      select barang.nama_barang, barang.merk, barang.stok
      from customer
      right join transaksi on customer.id_customer = transaksi.id_customer
      right join barang on transaksi.id_barang = barang.id_barang
      where customer.id_customer = '`+req.params.id+`'
  `, (err, result) => {
    if (err) throw err

    res.json({
      message: "Alhamdulillah transaksi sukses",
      data: result
    })
  })
})
app.listen(3000, ()=>{
  console.log('App mlaku ndek port 3000')
})