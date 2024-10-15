const express = require('express');
const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

// Set up multer for handling file uploads
const upload = multer({ dest: 'uploads/' });

// Store submissions in memory (this can be changed to a database later)
let submissionCounter = 0;
const submissions = {};

// Set up Nodemailer for email (replace with your actual email credentials)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'kv7216509@gmail.com',  // Replace with your email
        pass: 'usrh ccdo vjup fczv '    // Replace with your email password or app password
    }
});

// Function to generate a unique submission ID
function generateUniqueCode() {
    submissionCounter++;
    return `IJEMSS${String(submissionCounter).padStart(3, '0')}`;
}

// Serve static files from the "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// Route to serve the form HTML page from the root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'form.html'));
});

// Route to handle form submission
app.post('/', upload.single('file'), (req, res) => {
    const paperTitle = req.body.paper_title;
    const abstract = req.body.abstract;
    const researchArea = req.body.research_area;
    const country = req.body.country;

    const authors = [];
    for (let i = 1; i <= 7; i++) {
        const authorName = req.body[`author_name_${i}`];
        const authorEmail = req.body[`author_email_${i}`];
        const authorContact = req.body[`author_contact_${i}`];
        const authorInstitute = req.body[`author_institute_${i}`];
        if (authorName && authorEmail && authorContact && authorInstitute) {
            authors.push({
                name: authorName,
                email: authorEmail,
                contact: authorContact,
                institute: authorInstitute
            });
        }
    }

    // Generate a unique submission ID
    const uniqueCode = generateUniqueCode();

    // Store submission details in memory (or a database)
    submissions[uniqueCode] = {
        paperTitle,
        researchArea,
        country,
        status: 'Wait for 48 to 72 hours',
        authors
    };

    // Send confirmation email to the first author
    if (authors.length > 0) {
        const firstAuthor = authors[0];
        const mailOptions = {
            from: 'kv7216509@gmail.com',  // Replace with your email
            to: firstAuthor.email,         // First author's email
            subject: 'Paper Submission Confirmation',
            text: `
Dear ${firstAuthor.name},

Thank you for submitting your paper to IJEMSS. Here are the details of your submission:

Paper Title: ${paperTitle}
Unique Submission ID: ${uniqueCode}
Current Status: Wait for 48 to 72 hours.

Best regards,
IJEMSS Team`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log('Error sending confirmation email:', error);
                return res.status(500).send('Error sending confirmation email.');
            } else {
                console.log('Confirmation email sent:', info.response);

                // Send submission details to the admin
                const adminMailOptions = {
                    from: 'kv7216509@gmail.com',  // Replace with your email
                    to: 'kvinay00912@gmail.com',   // Replace with admin email
                    subject: 'New Paper Submission',
                    text: `
A new paper has been submitted.

Submission ID: ${uniqueCode}
Paper Title: ${paperTitle}
Research Area: ${researchArea}
Country: ${country}

First Author: ${authors[0] ? authors[0].name : 'N/A'}`,
                    attachments: req.file ? [  // Check if a file was uploaded
                        {
                            filename: req.file.originalname,  // Original file name
                            path: req.file.path               // Path to the uploaded file
                        }
                    ] : []  // No attachment if no file is uploaded
                };

                transporter.sendMail(adminMailOptions, (adminError, adminInfo) => {
                    if (adminError) {
                        console.log('Error sending admin email:', adminError);
                    } else {
                        console.log('Admin email sent:', adminInfo.response);
                    }
                });

                // Send response to the user
                return res.send(`Form submitted successfully! Your submission ID is: ${uniqueCode}`);
            }
        });
    } else {
        res.status(400).send('No authors provided.');
    }
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
