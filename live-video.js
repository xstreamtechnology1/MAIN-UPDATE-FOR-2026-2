// Replace with your actual YouTube channel ID and API key
const channelId = 'UCQHwa8FfUKnaogNqjiclUBQ';
const apiKey = 'AIzaSyBSle9_gDYRyMIQzdvDMjheX5E552r3do8';
const liveVideoContainer = document.getElementById('live-video-container');
const liveVideoError = document.querySelector('.live-video-error');

const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&eventType=live&type=video&key=${apiKey}`;

// Function to fetch live stream data
function fetchLiveStream() {
    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            // Check if live stream is available
            if (data.items && data.items.length > 0) {
                const videoId = data.items[0].id.videoId;
                // Embed the live stream video using iframe
                liveVideoContainer.innerHTML = `<iframe class="live-video-frame" src="https://www.youtube.com/embed/${videoId}?autoplay=1" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
                liveVideoError.style.display = 'none';  // Hide error message if stream is available
            } else {
                // If no live stream is found
                liveVideoContainer.innerHTML = '';
                liveVideoError.innerHTML = 'No live video is currently streaming.';
                liveVideoError.style.display = 'block';
            }
        })
        .catch(error => {
            // Handle any errors that occur during the fetch request
            liveVideoContainer.innerHTML = '';
            liveVideoError.innerHTML = 'An error occurred while fetching the live stream.';
            liveVideoError.style.display = 'block';
            console.error('Error fetching YouTube live stream data:', error);
        });
}

// Call the function to fetch the live stream when the page loads
document.addEventListener('DOMContentLoaded', fetchLiveStream);
