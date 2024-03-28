# Online-Coding-Web

You can go to my deployed Online-Coding-Website in this link :
[____link____](https://fantastic-sfogliatella-5e509d.netlify.app)
And the link to the git of the project :
[____link____](https://github.com/MayElnathan/Online-Coding-Web)

There you can see a few different rooms of different coding assignment , where the first person than enters each room is considers the Mentor and all the other that enters after him are students.

Mentor:
The mentors see the solution of the assignment , that for each student that enters the same room after him , he will see a new code block that represent the live coding that happened for each one (ordered one above the other in the order of entering - the first to enter will be on the top).
can see live whenever a student submits his code my the color change of the background (good = green / red = bad)

Student:
The student will see the coding assignment with short explanation ,
he can edit it and he can choose when to submit his solution.
Upon submitting the solution the background color of his code will change to green and a smile face will appear above / red and with a sad face. if he will change his code the smile will disappear and the background color will return to normal

There is a button to go back the the lobby.
there can be 1 Mentor for each room , 
and once there is no one in a room , again the first one to enter will be the Mentor.

The code solution and instruction for each code block are saved in MongoDB , The Mentor ans Students communicate with Socket.IO