import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Resend } from "resend";

dotenv.config();

const app = express();
app.use(express.json());

app.use(cors({
    origin: "*"
}));

const resend = new Resend(process.env.RESEND_API_KEY);

app.post("/api/book", async (req, res) => {
    try {
        const {
            fullName,
            email,
            phone,
            department,
            doctor,
            date,
            time,
            message,
        } = req.body;

        const bookingId = "APX-" + Math.floor(100000 + Math.random() * 900000);

        // 1️⃣ Send to Hospital (CRITICAL)
        const resultAdmin = await resend.emails.send({
            from: "onboarding@resend.dev",
            to: "nitinmishra28a@gmail.com",
            subject: `New Appointment Request - ${bookingId}`,
            html: `
                <h3>New Appointment Details</h3>
                <p><strong>Booking ID:</strong> ${bookingId}</p>
                <p><strong>Patient:</strong> ${fullName}</p>
                <p><strong>Department:</strong> ${department}</p>
                <p><strong>Doctor:</strong> ${doctor}</p>
                <p><strong>Date/Time:</strong> ${date} at ${time}</p>
                <p><strong>Contact:</strong> ${phone} / ${email}</p>
                <p><strong>Message:</strong> ${message || 'N/A'}</p>
            `,
        });

        // If the critical hospital email fails, stop here and tell the frontend
        if (resultAdmin.error) {
            console.error("Admin email failed:", resultAdmin.error);
            return res.status(500).json({
                success: false,
                message: "Hospital notification failed. Please try again later."
            });
        }

        // 2️⃣ Send to Patient (NON-CRITICAL - We don't stop the booking if this fails)
        try {
            await resend.emails.send({
                from: "onboarding@resend.dev",
                to: email,
                subject: `Appointment Confirmed - ${bookingId}`,
                html: `
                    <h1>Booking Confirmed!</h1>
                    <p>Dear ${fullName}, your appointment with ${doctor} is scheduled for ${date} at ${time}.</p>
                    <p>Your Reference ID is: <strong>${bookingId}</strong></p>
                `,
            });
        } catch (patientError) {
            // We just log this, we don't crash the server
            console.error("Patient email delivery skipped or failed:", patientError.message);
        }

        // 3️⃣ Final Success Response
        // We use 'return' to ensure no other code executes after this
        return res.json({
            success: true,
            bookingId
        });

    } catch (error) {
        console.error("CRITICAL Server Error:", error);
        // Ensure only ONE response is sent even in error
        if (!res.headersSent) {
            return res.status(500).json({
                success: false,
                message: "Internal Server Error"
            });
        }
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
    console.log(`Server running on port ${PORT}`)
);