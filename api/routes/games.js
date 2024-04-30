const express = require('express');
const Router = express.Router();
const sql = require('mssql');


const config ={
    server: 'multigame.cewnezl9ttkd.eu-central-1.rds.amazonaws.com',
    user: 'admin',
    password: 'robjov12',
    database: 'Multigame',
    options:{
        encrypt: true,
        trustServerCertificate: true,
        cryptoCredentialsDetails: {
          ca: "eu-central-1-bundle.pem"
        }
    }
}

Router.get('/', async(req, res, next) =>{
    try{
        await sql.connect(config);
        const results = await sql.query(`select * from igre`);
        res.status(500).json({
            message: results.recordset[0]
        });
    }
    catch(err){
        res.status(500).json({
            message: 'Something went wrong' + err
        });
    }
});


Router.get('/vpis/:mesto/:tocke/:procent/:racun', async(req, res, next) =>{
    try{
        await sql.connect(config);
        const mesto = req.params.mesto; // Mesto ki ga je uporabnik dosegel 
        const tocke = req.params.tocke; // Dosezene tocke
        const procent = req.params.procent; // Procent vseh možnih točk
        const racun = req.params.racun; // Za kateri racun je igral
        const racunIDQ = await sql.query(`select id_racuna from racuni where uporabnisko_ime = '${racun}'`); // Pridobivanje PK za vnesen račun
        const racunID = racunIDQ.recordset[0].id_racuna; // Oblikovanje rezultata v Javascript string
        const resultID = await sql.query(`select max(id_dosezka) from dosezki`);
        const nextID = resultID.recordset[0]['']+1;
        const countIger = await sql.query(`select id_igre from igre where id_igre = ${racunID}`);




        const stIgre = await sql.query(`select count(igre_id_igre) from dosezki where racuni_id_racuna = ${racunID}`);
        const stIgreST = stIgre.recordset[0]['']+1;

        const idIgre = await sql.query(`select max(id_igre) from igre`);
        const IDigre = idIgre.recordset[0][''];

        await sql.query(`insert into dosezki values(${nextID}, convert(date, '4.16.2024'), ${mesto}, ${tocke}, ${procent}, ${racunID}, ${IDigre})`);

        res.status(200).json({
            message: 'Done!'
        });

    }
    catch(err){
        res.json({
            message: 'User you entered does not exist in the database'
        });
    }
});



Router.get('/vpis/:user', async(req, res, next) =>{
    try{

        const user = req.params.user;
        await sql.connect(config);
        const id_uporabnika = await sql.query(`select id_racuna from racuni where uporabnisko_ime = '${user}'`);
        
        if(id_uporabnika.recordset.length < 0){

            res.status(404).json({
                message: 'User not found, look for typos!'
            });

        }
        else{

            const ID = id_uporabnika.recordset[0].id_racuna;
            console.log(ID);

            const stIger = await sql.query(`select count(*) from igre inner join dosezki on igre.id_igre = dosezki.igre_id_igre where dosezki.racuni_id_racuna = ${ID}`);
            const CurrentID = await sql.query(`select max(id_igre) from igre`);

            if(stIger.recordset.length >= 0){

                const nextID = CurrentID.recordset[0][''] +1;
                const STiger = stIger.recordset[0][''] +1;



            sql.query(`insert into igre values(${nextID}, ${STiger})`);

            res.status(200).json({
                message: 'Game saved!'

            });

            }
            
        }
        
    }
    catch(err){

        res.status(500).json({
            message: 'Something went wrong saving the game! '+ err
        });

    }
}); 

module.exports = Router; // Naredi modul dostopen znotraj mape "UNITYAPI"