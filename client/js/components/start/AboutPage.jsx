import React from 'react';

const AboutPage = ({}) => (
  <div className="box">
    <div className="content">
       <h1 className="title">General</h1>
       <p>This system is aimed at the creation of the electronic medical record for each department of the hospital. There is a set of the basic steps you might make to create the form of the medical record for your department:</p>
       <ul className="menu-list">
       <li>Create a department or choose one of the existing.</li>
       <li>Create the following elements of the medical record which will be used in your department:</li>
       <ul>
         <li>Create templates of the documents that are generated during patient treatment.</li>
         <li>Create questionnaires to collect data and use this data in the documents.</li>
         <li>Create variables that should be observed during patient treatment.</li>
       </ul>
       <li>Choose the sequence of the elements appearance in the electronic medical record.</li>
       <li>Clone similar elements from other departments to your department abd change it if it is needed.</li>
       <li>Invite other employees to the process of the medical record generation.</li>
     </ul>
    </div>
    <div className="content">
       <h1 className="title">Availability</h1>
       <p>At the beginning the system is available only by the limited number of employees. You might extend this list inviting your colleagues to the process of the medical record generation.</p>
       <h2 className="subtitle is-4">Add new member</h2>
       <p>You might add other employees to create the medical record of the department where you add them. You should be aware that the process of the medical record generation is highly important, as its structure will be used later to manage patients medial records. Therefore, add only those employees whom you might trust.</p>
       <p>To add new member, go to the <strong>Access</strong> tab and write the email of this member in the section <strong>Add new member</strong>. The mail with password will be sent to this person.</p>
       <h2 className="subtitle is-4">Add employees</h2>
       <p>You also can add employees who will manage medical records you have created. To add them, go to the <strong>Access</strong> tab and write the email of this people in the section <strong>Add employees</strong>. They will receive the password to the medical record management system.</p>
    </div>
    <div className="content"></div>
    <div className="content"></div>
    <div className="content"></div>
    <div className="content"></div>
    <div className="content"></div>
  </div>
);

export default AboutPage;
