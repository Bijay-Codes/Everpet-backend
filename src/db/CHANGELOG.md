### CHANGE LOGS #1

## Changes to schema

! updating constraint (integer) to (number) for the pet stats

# Reasons

a. Because most of calculation in stat happens using formulas and config con and will contain decimal values
b. Postgress will either floor the decimal points before storing and store it or just send error

feilds affected
a. hp
b. max hp
c. bond
d. stress
e. apetite

! changing default value of appetite feild from (100) to (0)
since by our backend the higher the number is more hungry the pet is not the opposite

feilds affected
appetite

New feilds added

sickness_lift_at - timestamptz can be null
reason_of_death - text can be null \* is_healing - boolean cannot be null

# Reasons?

a. sickness_lift_at - this one is added so that we can track when the sickness will be over from pet
b. reason_of_death - text that get stored for explaination of death, like old age or by sickness
c. is_healing - to track if healing is started since hp drain when sick but healing is diffrent from hp_drain when only sick


### CHANGE LOGS #2

## Changes to schema

! removing the constraint not null for owner_id of ownership_history table
! adding on delete set null to the owner_id feild

# Reason
The owner/user can delete their account freely but their pets exists regardless so others can take it
if the user_id from users get deleted then owner_id is to be null but had the constraint not null so it would have caused issues

