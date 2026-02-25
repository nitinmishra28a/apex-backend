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
        // 🔎 Reason 3 Fix: Destructure Insurance fields from req.body
        const {
            fullName,
            email,
            phone,
            department,
            doctor,
            date,
            time,
            message,
            insurance,          // Received from frontend
            insuranceProvider   // Received from frontend
        } = req.body;

        const bookingId = "APX-" + Math.floor(100000 + Math.random() * 900000);

        // 1️⃣ Send to Hospital
        const resultAdmin = await resend.emails.send({
            from: "onboarding@resend.dev",
            to: "nitinmishra28a@gmail.com",
            subject: `New Appointment - ${bookingId}`,
            html: `
                <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
                    <h2 style="color: #1e40af;">New Appointment Details</h2>
                    <hr />
                    <p><strong>Booking ID:</strong> ${bookingId}</p>
                    <p><strong>Patient Name:</strong> ${fullName}</p>
                    <p><strong>Contact:</strong> ${phone} | ${email}</p>
                    <p><strong>Department:</strong> ${department}</p>
                    <p><strong>Doctor:</strong> ${doctor}</p>
                    <p><strong>Scheduled:</strong> ${date} at ${time}</p>
                    
                    <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin-top: 15px;">
                        <p><strong>Insurance Used:</strong> ${insurance ? "✅ Yes" : "❌ No"}</p>
                        ${insurance ? `<p><strong>Provider:</strong> ${insuranceProvider}</p>` : ""}
                    </div>

                    <p><strong>Message:</strong> ${message || 'No additional message'}</p>
                </div>
            `,
        });

        if (resultAdmin.error) {
            console.error("Resend Error:", resultAdmin.error);
            return res.status(500).json({ success: false, message: "Email failed" });
        }

        // 2️⃣ Send Confirmation to Patient
        try {
            await resend.emails.send({
                from: "onboarding@resend.dev",
                to: email,
                subject: "Your Appointment is Confirmed!",
                html: `<p>Hi ${fullName}, your appointment for ${department} is confirmed. Ref: ${bookingId}</p>`
            });
        } catch (e) { console.log("Patient email skipped"); }

        return res.json({ success: true, bookingId });

    } catch (error) {
        console.error("Server Crash:", error);
        if (!res.headersSent) {
            return res.status(500).json({ success: false, message: "Internal error" });
        }
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
    console.log(`Server running on port ${PORT}`)
);