import { useAll } from "../../context/AllContext";
import {backendUrl} from '../../services/base'

export default function Profile(){
    const {auth}=useAll();
    return(
        <>
            <img 
            src={`${backendUrl}${auth.user?.profile_picture}`} 
            alt="User Profile" 
            className="w-16 h-16 rounded-full object-cover"
            />
            <h1>this is profile</h1>
        </>
    )
}