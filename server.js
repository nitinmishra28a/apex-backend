import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Resend } from "resend";

dotenv.config();

const app = express();
app.use(express.json());

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://yourdomain.com"
  ]
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

    await resend.emails.send({
      from: "appointments@yourdomain.com",
      to: "yourhospitalemail@gmail.com",
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

    res.json({ success: true, bookingId });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
});

app.listen(process.env.PORT || 5000, () =>
  console.log("Server running")
);