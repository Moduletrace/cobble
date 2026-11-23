/**
 * Tools that hand work to a run of its own. A plan step's reply that used
 * one has already put the next move in front of the user (the run's own
 * report), so it ends the step without the plan's card.
 */
const PlanWorkStartingTools = ["start_task", "delegate_task", "ask_bot", "hand_over_task"];

export default PlanWorkStartingTools;