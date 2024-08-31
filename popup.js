document.addEventListener('DOMContentLoaded', async () => {
    const problemsList = document.getElementById('problems-list');
    console.log("popup.js loaded");
    // chrome.runtime.sendMessage({
    //     action: "content"
    // });

    try {
        const result = await new Promise((resolve, reject) => {
            chrome.storage.local.get('filteredProblems', (items) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve(items);
                }
            });
        });

        const filteredProblems = result.filteredProblems || [];
        console.log("Received filtered problems.");

        if (filteredProblems.length > 0) {
            filteredProblems.forEach(problem => {
                console.log("length is not 0");
                const problemItem = document.createElement('li');
                const problemLink = document.createElement('a');
                problemLink.href = `https://codeforces.com/contest/${problem.contestId}/problem/${problem.index}`;
                problemLink.target = '_blank';
                problemLink.textContent = `${problem.contestId}${problem.index} - ${problem.name} (Rating: ${problem.rating}, Solves: ${problem.solvedCount})`;
                problemItem.appendChild(problemLink);
                problemsList.appendChild(problemItem);
                console.log(problemLink.textContent);
            });
        } else {
            problemsList.textContent = 'Go to the particular question for finding similar problems';
        }
    } catch (error) {
        console.error('Error retrieving filtered problems:', error);
        problemsList.textContent = 'Error occurred while retrieving problems.';
    }
});
