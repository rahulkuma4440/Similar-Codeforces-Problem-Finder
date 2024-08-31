// Function to extract contestId and problemIndex from the current URL
function getCurrentProblemData() {
    const url = window.location.href;
    const urlObject = new URL(url);
    const pathname = urlObject.pathname;
    const pathSegments = pathname.split('/');
    console.log(url);
    console.log("content.js");

    if (pathSegments.length === 5 && pathSegments[1] === 'problemset' && pathSegments[2] === 'problem') {
        // For URLs like https://codeforces.com/problemset/problem/123/A
        const contestId = pathSegments[3];
        const problemIndex = pathSegments[4];
        return { contestId, problemIndex };
    } else if (pathSegments.length === 5 && pathSegments[1] === 'contest' && pathSegments[3] === 'problem') {
        // For URLs like https://codeforces.com/contest/123/problem/A
        const contestId = pathSegments[2];
        const problemIndex = pathSegments[4];
        return { contestId, problemIndex };
    } else if (pathSegments.length === 5 && pathSegments[1] === 'gym' && pathSegments[3] === 'problem') {
        // For URLs like https://codeforces.com/gym/123/problem/A
        const contestId = pathSegments[2];
        const problemIndex = pathSegments[4];
        return { contestId, problemIndex };
    } else {
        console.error('URL does not match expected format');
        return null;
    }
}

// Function to fetch the solved count and tags for a given contestId and problemIndex
async function fetchSolvedCount(contestId, problemIndex) {
    try {
        const apiUrl = 'https://codeforces.com/api/problemset.problems';
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (data.status !== 'OK') {
            throw new Error(`API Error: ${data.comment}`);
        }

        const problems = data.result.problems;
        const problemStatistics = data.result.problemStatistics;

        const problem = problems.find(p => p.contestId === parseInt(contestId) && p.index === problemIndex);
        const statistics = problemStatistics.find(ps => ps.contestId === parseInt(contestId) && ps.index === problemIndex);

        if (problem && statistics) {
            const solvedCount = statistics.solvedCount;
            const tags = problem.tags || [];
            const rating = problem.rating || 'N/A';

            console.log(`Problem: ${problem.contestId}${problem.index} - ${problem.name}`);
            console.log(`Rating: ${rating}`);
            console.log(`Number of Solves: ${solvedCount}`);
            console.log(`Tags: ${tags.join(', ')}`);
            
            return { solvedCount, rating, tags };
        } else {
            console.error('Problem data not found in API response');
            return null;
        }
    } catch (error) {
        console.error('Error fetching problem data:', error);
        return null;
    }
}

// Function to extract problem data and filter similar problems
async function solve() {
    const problemData = getCurrentProblemData();
    console.log(problemData);
    if (problemData) {
        const { solvedCount, rating, tags } = await fetchSolvedCount(problemData.contestId, problemData.problemIndex);
        console.log('Solved Count:', solvedCount);
        console.log('Tags:', tags);

        getfilteredproblems(rating, solvedCount, tags);
    }
}

// Function to fetch and filter similar problems based on rating, solved count, and tags
function getfilteredproblems(rating, solvedCount, tags) {
    console.log("content.js - filtering problems");

    fetchFilteredProblemStatistics(rating, solvedCount, tags).then(filteredProblems => {
        // Store the filtered problems in chrome.storage.local to be accessed by popup.js
        chrome.storage.local.set({ filteredProblems: filteredProblems }, () => {
            console.log("Filtered problems stored.");
        });
    });
}

// Function to fetch problems from Codeforces API and apply the filtering logic
async function fetchFilteredProblemStatistics(referenceRating, referenceSolvedCount, referenceTags) {
    try {
        console.log("Fetching problems from Codeforces API");
        const apiUrl = 'https://codeforces.com/api/problemset.problems';
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (data.status !== 'OK') {
            throw new Error(`API Error: ${data.comment}`);
        }

        const problems = data.result.problems;
        const problemStatistics = data.result.problemStatistics;

        const filteredProblems = [];

        problems.forEach((problem, index) => {
            const statistics = problemStatistics[index];
            const rating = problem.rating || 0;
            const solvedCount = statistics.solvedCount || 0;
            const tags = problem.tags || [];

            const isRatingWithinRange = Math.abs(rating - referenceRating) <= 200;
            const isSolvedCountWithinRange = Math.abs(solvedCount - referenceSolvedCount) <= 2000;
            const hasMatchingTags = tags.some(tag => referenceTags.includes(tag));

            if (isRatingWithinRange && isSolvedCountWithinRange && hasMatchingTags) {
                filteredProblems.push({
                    contestId: problem.contestId,
                    index: problem.index,
                    name: problem.name,
                    rating: rating,
                    solvedCount: solvedCount,
                    tags: tags
                });
            }
        });

        console.log('Filtered Problems:', filteredProblems);

        return filteredProblems;

    } catch (error) {
        console.error('Error fetching problem statistics:', error);
        return [];
    }
}

// Start the process
solve();
