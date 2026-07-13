import { useEffect, useState } from "react";
import axios from "axios";
const API_URL = "http://localhost:5000/users";
const UserProfile = ({ userId }) => {
    const [userData, setUserData] = useState(null);
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await axios.get(`${API_URL}/${userId}`);
                setUserData(response.data);

            } catch (error) {
                console.error("Error fetching user:", error);
            }
        }
        fetchUser();
    }, [userId]);
    return (
        <div>
            <h1>User Profile</h1>
            <p>Name: {userData.firstName} {userData.lastName}</p>
            <p>Email: {userData.email}</p>
            
        </div>
    )
}
export default UserProfile;