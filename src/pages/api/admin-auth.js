import { NextApiRequest, NextApiResponse } from "next";

let adminPassword = "admin123"; // Default password, can be changed via API
const MASTER_PASSWORD = "MasterNepal";

export default function handler(req, res) {
  if (req.method === "POST") {
    const { password } = req.body;
    if (password === MASTER_PASSWORD || password === adminPassword) {
      return res.status(200).json({ success: true });
    } else {
      return res.status(401).json({ success: false, error: "Invalid password" });
    }
  } else if (req.method === "PUT") {
    const { oldPassword, newPassword } = req.body;
    if (oldPassword === MASTER_PASSWORD || oldPassword === adminPassword) {
      adminPassword = newPassword;
      return res.status(200).json({ success: true, message: "Password updated" });
    } else {
      return res.status(401).json({ success: false, error: "Invalid old password" });
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
