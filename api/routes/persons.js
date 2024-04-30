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
        const result = await sql.query(`select * from racuni`);
        const result2 = await sql.query(`select * from osebe`);
        const result3 = await sql.query(`select * from igre`);
        const result4 = await sql.query(`select * from dosezki`);


        res.status(200).json({
            message: 'It works!',
            data: result.recordset,
            data2: result2.recordset,
            data3: result3.recordset,
            data4: result4.recordset
        });

    }
    catch(err){

        res.status(500).json({
            message: 'Something went wrong ' + err
        });

    }
});



// Pridobivanje parametrov za vpis v bazo

Router.get('/vpis/:ime/:priimek/:email/:datum/:telst', async(req, res, next) =>{
    try{
        await sql.connect(config);
        const ime = req.params.ime;
        const priimek = req.params.priimek;
        const datRoj =  req.params.datum;
        const mail = req.params.email;
        const telst = req.params.telst;
        const ID = await sql.query(`select max(id_osebe) from osebe`);
        const IDosebe = ID.recordset[0]['']+1; // Pridobivanje Unikatnega ID_osebe =====> +1 najvišjem aktualnem ključu
        const result = await sql.query(`insert into osebe values(${IDosebe}, '${ime}', '${priimek}', '${mail}', convert(date, '${datRoj}'), ${telst})`);

        res.status(200).json({
            message: 'It works!'
        });


    }
    catch(err){ // Če se pojavi napaka, jo izpiše skupaj s tekstom
        res.json({
            message: 'Error has occured, please check logs' + err
        });
    }
});



// Izbris vseh podatkov osebe

Router.get('/izbris/:ime', async(req, res, next) =>{
    try{

        await sql.connect(config);
        const ime = req.params.ime;
        const IDosebe = await sql.query(`select id_osebe from osebe where ime = '${ime}'`);
        


            if(IDosebe.recordset.length >= 0){ // Preveri će

                const ID = IDosebe.recordset[0].id_osebe; // Pridobivanje PK osebe
                console.log(ID);
                
                const idRacuna = await sql.query(`select id_racuna from racuni where osebe_id_osebe = ${ID}`);
                console.log(idRacuna);
    
                if(idRacuna.recordset.length > 0){
    
                    const IDRacuna = idRacuna.recordset[0].id_racuna +1;
                    console.log(IDRacuna);
                    await sql.query(`delete from dosezki where racuni_id_racuna = ${IDRacuna}`);   
                }


                await sql.query(`delete from racuni where osebe_id_osebe = ${ID}`);
                await sql.query(`delete from osebe where id_osebe = ${ID}`);
    
                res.status(200).json({
                    message: 'You were successfully deleted from all databases'
                });
    
            }
            else{

                res.status(500).json({
                    message: 'There is noone by that name in database to delete!'
                });

            }
        }        

    catch(err){

        res.status(500).json({
            message: 'Something went wrong, check if your name is correct' + err
        });

    }
});

module.exports = Router; // Naredi modul dostopen znotraj mape "UNITYAPI"