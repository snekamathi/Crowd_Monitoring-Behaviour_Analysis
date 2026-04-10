"""
CrowdSense AI — Density Estimation Module
Classifies crowd density using count thresholds and provides
both categorical and numeric density values.
"""


class DensityEstimator:
    """Area-aware crowd density classifier."""

    def __init__(self, low_threshold=30, high_threshold=80):
        """
        Args:
            low_threshold:  count below this → Low density.
            high_threshold: count above this → High density.
        """
        self.low_thresh = low_threshold
        self.high_thresh = high_threshold
        print(f"Initialization: Density estimation loaded "
              f"[low<{low_threshold}, high>{high_threshold}]")

    def estimate(self, current_count, frame_area=None):
        """
        Classify crowd density.

        Args:
            current_count: Number of detected/tracked people.
            frame_area:    Optional frame area in pixels for density ratio.

        Returns:
            (category, density_value):
                category      — "Low", "Medium", or "High"
                density_value — numeric ratio (people per 100k px²)
                                or raw count if no area provided.
        """
        if frame_area and frame_area > 0:
            density_value = round(current_count / (frame_area / 100000), 2)
        else:
            density_value = current_count

        if current_count < self.low_thresh:
            return "Low", density_value
        elif current_count < self.high_thresh:
            return "Medium", density_value
        else:
            return "High", density_value
