"""
Enums for file processing workflow.
"""
from enum import IntEnum


class FileProcessingStep(IntEnum):
    """Enum for file processing steps in the workflow."""
    DISCOVERED = 1
    UPLOADED = 2
    SUMMARIZED = 3
    CHECKED_ELLIGIBILITY = 4 