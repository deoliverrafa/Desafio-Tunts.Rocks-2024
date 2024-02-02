const express = require('express')
const { google } = require('googleapis')
const credentials = require("./credentials/credentials.json") /* Getting credentials */
const app = express()

// Function to make the authentication on googleSheets
async function getAuthSheets() {

    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: "https://www.googleapis.com/auth/spreadsheets"
    })

    const client = await auth.getClient(); /* Getting Client data*/

    const googlesheets = google.sheets({
        version: 'v4',
        auth: client
    }) /* Creating a instace of client */

    const spreadSheetId = '1kY_edYv_PehDUHOkWUfXeDYYgv3KBC5nJj7Af5iMyJM' /* SheetId to work */

    return {
        auth,
        googlesheets,
        client,
        spreadSheetId
    } /* Returning the nescessary data to aplication */
}

// Get route to take the sheet data
app.get("/metadata", async (req, res) => {
    try {

        const { googlesheets, auth, spreadSheetId } = await getAuthSheets();

        /* Do a call to take the data of sheet*/
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

// Route to get the rows info
app.get("/getRows", async (req, res) => {
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


// Startign the api
let port;
app.listen(port = 3001, () => console.log(`Rodando na porta ${port}`))