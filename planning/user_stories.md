## Group Name
**Power Panel**

## Members
- **Ariane Doris Umuhire**
- **Ardelia Putridaryana**
- **Zainab Adeola**

## User Roles
Below is a framework for identifying the primary user roles involved in this project.

| **Role Name** | **Description** | **Notes** |
|---|---|---|
| Client | The user who needs a job done. | Can be interchangeable |
| Provider | The user who is looking for a job. | Can be interchangeable |

## User Personas
These personas represent the target audience for our application.

### Persona 1
- **Name**: Oscar Grammy
- **Age**: 17
- **Location**: Oklahoma City, Oklahoma
- **Relationship with technology**: Avid phone user and uses the app weekly for allowance money
- **Motivation**: To get a weekly allowance for leisure spending
- **Pain points**: High school student

### Persona 2
- **Name**: Aurora Borealis
- **Age**: 36
- **Location**: Indianapolis, Indiana
- **Relationship with technology**: Uses desktop more often due to work and uses the app occasionally when things need to get done
- **Motivation**: To complete tasks she does not have time to do
- **Pain points**: Orthopedic surgeon who works 12-hour shifts

### Persona 3
- **Name**: Sara Abraham
- **Age**: 51
- **Location**: Lincoln, Nebraska
- **Relationship with technology**: Moderately uses technology and is both a mobile and desktop user, but her father George has trouble with it
- **Motivation**: Wants to help her father, who is getting older
- **Pain points**: Daughter of George Abraham (75)

### Persona 4
- **Name**: Kevin Manzi
- **Age**: 25
- **Location**: Fort Worth, Texas
- **Relationship with technology**: University student who actively uses all devices (mobile, tablet, desktop)
- **Motivation**: Needs a side hustle to earn extra money
- **Pain points**: Student loans

## User Stories
The following table outlines the user stories prioritized for this project.

| **#** | **User Story (As a... I want... so that...)** | **Role** | **Feature Area** |
|---|---|---|---|
| 1 | As a client, I want to be able to see a provider's skills, so I can know if they can complete the job I want. | Client | Skills Page |
| 2 | As a client, I need a list of plumbers near me who can quickly fix my sink. | Client | Location Near Me |
| 3 | As a provider, I want to fill out my bio, so my personality can shine through to clients. | Provider | Bio |
| 4 | As a client, I want to be able to show that a job listing has been completed or filled, so I don't get any more providers applying to my listing. | Client | Completed Listing |
| 5 | As a provider, I want to be able to talk with my client about the job, so I can get more information about a listing. | Both | Inbox |
| 6 | As a client, I want to know which provider is qualified and trustworthy for the job, so I can ensure that my job gets done efficiently and effectively. | Client | Reviews |
| 7 | As a client, I want to be able to post my listings with images, so providers can see a visual of the service to be completed.| Client | Post Listings |
| 8 | As a client, I want to be able to post a listing with no images, so I can maintain my privacy regarding the service I need completed. | Client | Post Listing |
| 9 | As a provider, I want to display my previous work, so I can attract new clients. | Provider | Skills Tab |
| 10 | As a provider, I want to set my profile, so I can attract parents looking for a babysitter. | Provider | User Profile |
| 11 | As a client, I want to be able to see all the applicants under my listing, so I can identify providers relevant to the specific listing. | Client | Listing Page |
| 12 | As a provider, I want to be able to click into a listing, so I can get more information about the listing. | Provider | Listing Page |
| 13 | As a provider, I want to be able to scroll through posted listings and see which ones may interest me. | Provider | Feed Scroll |

## AI Feature User Stories
This section is dedicated to AI-specific features to highlight their distinct value proposition.

| **#** | **User Story (As a... I want... so that...)** | **Role** | **Feature Area** |
|---|---|---|---|
| 1 | As a client, I want to be matched to someone who can do garden work. | Client | AI Matching |
| 2 | As a provider, I want to use AI to see the best-priced jobs that apply to my skills. | Provider | AI Sorting |
| 3 | As a client, I want to see a suggested price for my job listing, so more people will apply and consider my listing. | Client | AI Listing Price |
| 4 | As a client, I want to see a list of braiders that match my style, so I can choose one who will do my hair. | Client | AI Search |

## Decisions Log — User Stories

- **Story we debated the scope of**: "As a client, I need a list of plumbers near me who can quickly fix my sink." We debated whether to keep this story plumber-specific or broaden it to all local services.
  **How we resolved it**: We kept the user-facing example in the story for clarity, but scoped implementation under `Location Near Me` so it supports any service category in the product.
- **Story we cut (and why)**: "As a client, I want to upload videos in my listing so providers can better understand my request." We cut this story because it adds high storage and moderation complexity for an early milestone and is not required to validate core marketplace matching.
- **Story that changed after feedback**: Original: "As a client, I want to post my listing with either images or no images." Revised: "As a client, I want to be able to post my listings with images or without images, so providers can understand what I need while I maintain control over my privacy." This revision clarified the user benefit and reduced overlap with Story #8.
- **AI feature story: user benefit we landed on**: For AI pricing, we centered the story on confidence and response rate: clients get a practical suggested price that helps attract qualified applicants faster, instead of focusing on the model or algorithm.
