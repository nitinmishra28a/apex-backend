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
            subject: `New Appointment - ${bookingId}`,
            html: `...`,
        });

        if (resultAdmin.error) {
            console.error("Admin email failed:", resultAdmin.error);
            return res.status(500).json({
                success: false,
                message: "Hospital notification failed"
            });
        }

        // 2️⃣ Send to Patient (NON-CRITICAL)
        try {
            const resultPatient = await resend.emails.send({
                from: "onboarding@resend.dev",
                to: email,
                subject: `Appointment Confirmed - ${bookingId}`,
                html: `...`,
            });

            if (resultPatient.error) {
                console.error("Patient email failed:", resultPatient.error);
            }

        } catch (patientError) {
            console.error("Patient email crashed:", patientError);
        }

        // Booking success regardless of patient email
        res.json({ success: true, bookingId });

        // Check if Resend actually sent it (it returns error if API key is invalid or domain not verified)
        if (resultAdmin.error || resultPatient.error) {
            return res.status(400).json({
                success: false,
                message: "Email service error",
                error: resultAdmin.error || resultPatient.error
            });
        }

        res.json({ success: true, bookingId });

    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
    console.log(`Server running on port ${PORT}`)
);