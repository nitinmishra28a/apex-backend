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

        // 1️⃣ Send Notification to Hospital Admin
        const resultAdmin = await resend.emails.send({
            from: "onboarding@resend.dev",
            to: "nitinmishra28a@gmail.com",
            subject: `New Appointment - ${bookingId}`,
            html: `
            <h2>New Appointment Booking</h2>
            <p><strong>Booking ID:</strong> ${bookingId}</p>
            <p><strong>Name:</strong> ${fullName}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone}</p>
            <p><strong>Department:</strong> ${department}</p>
            <p><strong>Doctor:</strong> ${doctor}</p>
            <p><strong>Date:</strong> ${date}</p>
            <p><strong>Time:</strong> ${time}</p>
            <p><strong>Message:</strong> ${message || "Not Provided"}</p>
          `,
        });

        // 2️⃣ Send Confirmation to Patient (Using a different variable name)
        const resultPatient = await resend.emails.send({
            from: "onboarding@resend.dev",
            to: email,
            subject: `Appointment Confirmed - ${bookingId}`,
            html: `
            <h2>Your Appointment is Confirmed ✅</h2>
            <p><strong>Booking ID:</strong> ${bookingId}</p>
            <p><strong>Doctor:</strong> ${doctor}</p>
            <p><strong>Department:</strong> ${department}</p>
            <p><strong>Date:</strong> ${date}</p>
            <p><strong>Time:</strong> ${time}</p>
            <br/>
            <p>Please arrive 15 minutes early.</p>
            <p>Thank you for choosing Apex Hospital.</p>
          `,
        });

        console.log("Admin Email:", resultAdmin);
        console.log("Patient Email:", resultPatient);

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