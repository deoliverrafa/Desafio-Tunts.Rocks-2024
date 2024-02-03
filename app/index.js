const express = require('express')
const { google } = require('googleapis')
const credentials = require("./credentials/credentials.json") // Getting credentials 
const app = express()

// Function to make the authentication on googleSheets
async function getAuthSheets() {

    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: "https://www.googleapis.com/auth/spreadsheets"
    })

    const client = await auth.getClient(); // Getting Client data

    const googlesheets = google.sheets({
        version: 'v4',
        auth: client
    }) // Creating a instace of client

    const spreadSheetId = '1kY_edYv_PehDUHOkWUfXeDYYgv3KBC5nJj7Af5iMyJM' // SheetId to work

    return {
        auth,
        googlesheets,
        client,
        spreadSheetId
    } // Returning the nescessary data to aplication
}

// Get route to take the sheet data
app.get("/metadata", async (req, res) => {
    try {

        const { googlesheets, auth, spreadSheetId } = await getAuthSheets();

        // Do a call to take the data of sheet
        const metadata = await googlesheets.spreadsheets.get({
            auth,
            spreadsheetId: spreadSheetId
        })

        // Return the data
        res.status(200).send(metadata);
    } catch (error) {
        res.status(500).send("Error" + error)
    }
})

// Route to get sheet data
app.get("/getSheetData", async (req, res) => {
    try {

        const { googlesheets, auth, spreadSheetId } = await getAuthSheets();

        /* Here we get the sheet info 
            Range is equal to title from
            sheets of metadata
        */
        const getRows = await googlesheets.spreadsheets.values.get({
            auth,
            spreadsheetId: spreadSheetId,
            range: "engenharia_de_software",
            valueRenderOption: "UNFORMATTED_VALUE",
            dateTimeRenderOption: "FORMATTED_STRING"
        })

        // Returnign the rows data
        res.status(200).send(getRows.data);
    } catch (error) {
        res.status(500).send("Error" + error)
    }
})

// Route to att student stats
app.get('/attStudentsStats', async (req, res) => {
    try {
        const { googlesheets, auth, spreadSheetId } = await getAuthSheets();

        // Get sheet data
        const getRows = await googlesheets.spreadsheets.values.get({
            auth,
            spreadsheetId: spreadSheetId,
            range: "engenharia_de_software",
            valueRenderOption: "UNFORMATTED_VALUE",
            dateTimeRenderOption: "FORMATTED_STRING"
        });

        // Extract the students list
        const students = getRows.data.values.slice(2); // Cut the first two rows of non student related information

        const minimunGrade = 70;
        const finalExam = 50;
        const maximunClasses = 60;
        const absenceRejectionPercentage = 0.25; // 25% of the total number of classes

        function calculateSituation(student) {
            const [, , fouls, p1, p2, p3] = student; //Getting Student data
            const average = (Number(p1) + Number(p2) + Number(p3)) / 3;
        
            if (fouls > maximunClasses * absenceRejectionPercentage) {
                return { situation: "Reprovado por Falta", finalExam: 0 };
            } else if (average >= minimunGrade) {
                return { situation: 'Aprovado', finalExam: 0 };
            } else if (average >= finalExam && average < minimunGrade) {
                return { situation: 'Exame Final', finalExam: calculateNaf(average) };
            } else {
                return { situation: 'Reprovado por Nota', finalExam: 0 };
            }
        }
        
        function calculateNaf(average) {
            const naf = Math.max(0, (100 - average)); // Calc to NAF
            const roundedNumber = Math.ceil(naf); // Rounding number to next 
            return roundedNumber;
        }
        
        // Updating sheets with students stats
        const studentsUpdated = students.map((student, index) => {
            if (index == 0) {
                return null;
            }
            const { situation, finalExam } = calculateSituation(student);
            return [situation, finalExam]; // Return Array of arrays
        });

        const updatedValues = {
            values: studentsUpdated
        }

        await googlesheets.spreadsheets.values.update({
            spreadsheetId: spreadSheetId,
            range: "engenharia_de_software!G4", // Start from first student
            valueInputOption: "USER_ENTERED",
            resource: updatedValues
        })

        return res.status(200).send(studentsUpdated);
    } catch (error) {
        res.status(500).send("Erro interno do servidor");
    }
});


// Starting the api
let port;
app.listen(port = 3001, () => console.log(`Rodando na porta ${port}`))