# Faculty Course Selection System  

A MERN stack application to streamline the faculty course selection process by collecting faculty preferences for courses they wish to teach each semester while considering various constraints and requirements.  

## Features  

- **Faculty Dashboard**: Allows faculty members to submit their course preferences.  
- **Admin Panel**: Manages faculty requests, assigns courses based on constraints, and tracks availability.  
- **Automated Conflict Resolution**: Handles course conflicts based on predefined rules.  
- **Authentication & Authorization**: Secure login for faculty and admins.  
- **Dynamic Constraints**: Customizable constraints like faculty workload, prerequisites, and department requirements.  

## Tech Stack  

- **Frontend**: React.js (with Tailwind CSS or Material UI)  
- **Backend**: Node.js, Express.js  
- **Database**: MongoDB (Mongoose ODM)  
- **Authentication**: JWT-based authentication  
- **State Management**: Redux (if required)  


## API Endpoints  

- `POST /api/auth/login` - Faculty/Admin login  
- `GET /api/faculty/courses` - Fetch available courses  
- `POST /api/faculty/submit-preferences` - Submit course preferences  
- `GET /api/admin/assignments` - View faculty-course assignments  

## Future Enhancements  

- AI-based course assignment recommendations  
- Analytics dashboard for better decision-making  
- Email notifications for course allocations  

## Contributing  

1. Fork the repo  
2. Create a new branch (`feature-branch`)  
3. Commit changes  
4. Open a pull request  

## License  

MIT License  
