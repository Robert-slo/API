const express = require('express'); // Potrebna metoda za API
const Router = express.Router(); // Potrebna metoda za API
const sql = require('mssql'); // Potreben library za povezavo na MSSQL Server

// Konfiguracija shranjena v spremenljivko, ki se jo uporabi za povezavo na podatkovno bazo
const config ={ 
    server: 'multigame.cewnezl9ttkd.eu-central-1.rds.amazonaws.com', // Povezava na bazo, na AWS
    user: 'admin', // Uporabnik za podatkovno bazo
    password: 'robjov12', // Geslo za uporabnika
    database: 'Multigame', // Ime baze, na katero se povezujem
    options:{
        encrypt: true, // Enkripcija podatkov, ki potujejo preko interneta
        trustServerCertificate: true, // Povezava med bazo in programom preko varnega certifikata
        cryptoCredentialsDetails: {
          ca: "eu-central-1-bundle.pem" // Povezava na bazo, preko AWS regionalnega certifikata, ki je obvezen za povezavo
        }
    }
}



// Pridobivanje podatkov

Router.get('/', async (req, res, next) => { // Vsak GET request, ki bo napoten sem, in bo dobil vse podatke shranjene v bazi
    try {
        await sql.connect(config);
        const result = await sql.query(`select * from racuni`);
        res.status(200).json({
            message: 'Data retrieved successfully',
            data: result.recordset
        });
    } catch (err) { // Če se pojavi napaka, se jo prestreže in izpiše
        console.error(err);
        res.status(500).json({
            message: 'Error retrieving data from database' + err // izpis dodanega besedila in napake v obliki JSON-a
        });
    }
});




//Login


Router.get('/:username/:password', async (req, res, next) =>{    // Vsak GET request, ki bo napoten sem, bo program prebral parametre iz URL-ja in jih shranil v spremenljivke.
    try{
        await sql.connect(config); // povezava na Bazo. 
        const username = req.params.username;   // Pridobivanje vnesenega uporabnika
        const password = req.params.password;   // Pridobivanje vnesenega gesla
        const resultUsername = await sql.query(`select uporabnisko_ime from racuni where uporabnisko_ime = '${username}'`); // Pridobivanje podatkov iz baze, ki jih bom nato uporabil za autentikacijo
        const resultGeslo = await sql.query(`select geslo from racuni where uporabnisko_ime = '${username}'`);

        if(resultUsername.recordset.length > 0 && resultGeslo.recordset.length > 0){
            const basePassword = await resultGeslo.recordset[0].geslo;
            const baseUsername = await resultUsername.recordset[0].uporabnisko_ime;
            
            if(password === basePassword && baseUsername === username){
                res.status(200).json({
                    message: 'You have successfully login into program!',
                    name: username
                });
            }
            else{
                res.status(500).json({
                    message: 'Try again, check username and password'
                });
            }
        
        }
        else{
            res.status(500).json({
                message: 'There is no such a user in database'
            });
        }

    }
    catch(err){ // V primeru, da pride do napake se napako prestreže in izpiše skupaj s besedilom
        res.status(500).json({
            message: 'Something went wrong' + err
        });
    }
    
});


//Vpis v bazo


Router.get('/vpis/:user/:password/:ime/:priimek', async (req, res, next) => { // Pridobivanje parametrov, za vpis v bazo
    
    try{
        await sql.connect(config);
        const ime = req.params.ime;
        const priimek = req.params.priimek;
        const username = req.params.user; // Pridobivanje parametra uporabnika
        const password = req.params.password; // Pridobivanje parametra uporabnika
        const ID = await sql.query(`select MAX(id_racuna) from racuni`) ; // Pridobivanje unikatnega ID-ja iz baze
        const maxID = ID.recordset[0][''];


        const oseba = await sql.query(`select id_osebe from osebe where ime = '${ime}' and priimek = '${priimek}'`);

            const IDosebe = oseba.recordset[0].id_osebe;


            let nextID = maxID ? maxID + 1 : 1;
    
            await sql.query(`insert into racuni values(${nextID}, '${username}', '${password}', ${IDosebe})`); // Vpis podatkov v bazo
            console.log(ID);
            
            
            res.json({
                message: "data inserted successfully", // Besedilo, ki pove da je uporabnik uspešno vpisal podatke v bazo 
                });
        }
        catch (err){
            res.json({
                message: 'Check name or surname for typos!' // Error message
            });
        };
});



//Menjava gesla


Router.get('/patch/:user/:password', async (req, res, next) => { // oznake ":" označuje parametre, ki jih lahko dobim in shranim kot spremenljivko v programu
    try {
        await sql.connect(config); // povezava na bazo
        const password = req.params.password; // pridobivanje novega gesla, in dodajanje gesla v spremenljivko
        const username = req.params.user; // pridobivanje uporabnika, za katerega se spreminja geslo
        const pass = await sql.query(`select geslo from racuni where uporabnisko_ime = '${username}'`) // Pridobivanje iz baze prejšnjega gesla za uporabnika
        const userPass = pass.recordset[0].geslo;
        if(userPass === password){ // preverjanje ali je novo geslo enako prejšnjemu oz. aktualnemu
            res.status(400).json({ // V primeru, da je geslo enako sporoči programu sporočilo
                message: 'Password cannot be same as before' // To sporočilo se vrne programu, ker je spremenjeno geslo enako aktualnemu
            });
        }
        else{ // če pa je geslo drugačno prejšnjemu se vrne sporočilo, da je vse vredu
            const result = await sql.query(`update racuni set geslo = '${password}' where uporabnisko_ime = '${username}'`); // Menjava gesla za uporabnika, s SQL ukazom na bazi
        res.status(200).json({ // Vrnitev statusa, da vse poteka vredu 
            message: 'Password has been changed successfully' // Vrnitev sporočila, da je vse vredu
            
        });

        }
    } catch (err) { // V primeru, da pride do napake, to napako prestreže, in jo izpiše
        console.error(err); // Izpis napake
        res.status(500).json({ // Vrne status, da nekaj ni vredu
            message: 'Error changing the password, check if your username is different from the original one ' + err, // Vrnitev sporočila, da je geslo enako prejšnjemu
        });
    }
});


//Izbris uporabnika, glede na uporabnisko ime

Router.get('/delete/:username', async(req, res, next) =>{ 
    try{
        await sql.connect(config); // Povezava na bazo
        const username = req.params.username; // Pridobivanje uporabnisko ime iz parametra v URL

        const ID = await sql.query(`select MAX(id_racuna) from racuni`); // Izvršitev query-ja na bazi, za pridobitev naslednjega Primarnega Ključa
        stID = ID.recordset[0][''] +1; // Pridobivanje naslednjega PK iz podatkov na bazi
        console.log(stID); // Izpis naslednjega PK v konzoli, za test


        let izpis = 'No such a user in database'
        let stevec = 1; // Števec za preverjanje uporabnika na bazi
        let name = ''; // Spremenljivka, ki bo dobivala naslednja uporabniška imena na bazi
        let BaseUsername = ''; // Spremenljivka, za pridobivanje podatkov na bazi
        while(stevec < stID){ // Ko je števec manjši od najvišjega PK, se vse izvrši

            BaseUsername = await sql.query(`select uporabnisko_ime from racuni where id_racuna = ${stevec}`); // Query na bazi za pridobitev uporabnika na PK števca
            
            if(BaseUsername.recordset.length > 0){ // Če obstaja podatek o uporabniškem imenu na bazi se vse izvede, če ne pa preskoči

                name = BaseUsername.recordset[0].uporabnisko_ime; // Pridobivanje pravega podatka iz Query-ja
                console.log(name); // Test delovanja v konzoli
                
                if(username === name){ // Če je vpisano uporabnisko ime za izbris enako uporabniskemu imenu v bazi ali je ime že izbrisano
                    await sql.query(`delete from dosezki where racuni_id_racuna = ${stevec}`); // Potrebno je izbrisati podatke o igrah, za račun, ker je baza tako narejena
                    await sql.query(`delete from racuni where id_racuna = ${stevec}`); // Izbris uporabnika, ki ga je igralec želel izbrisati
                    izpis = 'Username has been deleted successfully' // Če ime, ki ga je vnesel igrales ustreza vsem pogojem, se izpiše izpis spremenljivka
                }
            }
            
            stevec++; // Števec +1
        }

        res.status(200).json({
            message: izpis // Izpis spremenljivke
        });
    }
    catch(err){
        res.status(500).json({
            message: 'Error has occured: ' + err
        });
    }
});

module.exports = Router; // Naredi modul dostopen znotraj mape "UNITYAPI"