import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Select,
  FormControl,
  InputLabel,
  MenuItem,
  IconButton,
  Alert,
  Snackbar,
  Dialog,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { profileApi } from '../../lib/profileApi';

interface EntityModalProps {
  open: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  entity?: {
    _id: string;
    name: string;
    entity_type?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      postal_code?: string;
      country?: string;
    };
  };
  accountId?: string;
  onSuccess: () => void;
  onShowSuccess?: (message: string) => void;
  onShowError?: (message: string) => void;
}

interface LocationData {
  address: string;
  lat: number;
  lng: number;
}

const EntityModal: React.FC<EntityModalProps> = ({
  open,
  onClose,
  mode,
  entity,
  accountId,
  onSuccess,
  onShowSuccess,
  onShowError
}) => {
  // Form state
  const [entityName, setEntityName] = useState('');
  const [entityType, setEntityType] = useState('');
  const [entityLocation, setEntityLocation] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
  
  // Location suggestions
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const locationInputRef = React.useRef<HTMLDivElement>(null);
  
  // Messages
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Initialize form data when modal opens
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && entity) {
        // Edit mode - populate with existing data
        setEntityName(entity.entity_name || '');
        setEntityType(entity.entity_type || '');
        
        // Format existing address
        if (entity.address) {
          const { street, city, state, postal_code, country } = entity.address;
          const addressParts = [street, city, state, postal_code, country].filter(Boolean);
          const formattedAddress = addressParts.join(', ');
          setEntityLocation(formattedAddress);
          
          // Create mock location data for existing address
          setSelectedLocation({
            address: formattedAddress,
            lat: 0,
            lng: 0
          });
        } else {
          setEntityLocation('');
          setSelectedLocation(null);
        }
      } else {
        // Create mode - reset form
        setEntityName('');
        setEntityType('');
        setEntityLocation('');
        setSelectedLocation(null);
      }
    }
  }, [open, mode, entity]);

  // Check if form has changes (for edit mode) or is valid (for create mode)
  const isFormValid = () => {
    if (mode === 'create') {
      return entityName.trim() !== '' && entityType !== '' && selectedLocation !== null;
    } else {
      // Edit mode - check if there are changes
      if (!entity) return false;
      
      const originalName = entity.entity_name || '';
      const originalType = entity.entity_type || '';
      const originalAddress = entity.address ? 
        [entity.address.street, entity.address.city, entity.address.state, entity.address.postal_code, entity.address.country]
          .filter(Boolean).join(', ') : '';
      
      return (
        entityName.trim() !== originalName ||
        entityType !== originalType ||
        entityLocation.trim() !== originalAddress
      );
    }
  };

  // Location handling functions
  const handleLocationInputChange = async (value: string) => {
    setEntityLocation(value);
    
    if (value.length < 3) {
      setLocationSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      // Check if Google Maps API is loaded with places library
      if (!(window as any).google || 
          !(window as any).google.maps || 
          !(window as any).google.maps.places ||
          !(window as any).google.maps.places.AutocompleteService) {
        console.error('Google Maps API not loaded yet. Please wait and try again.');
        setErrorMessage('Google Maps is still loading. Please wait a moment and try again.');
        return;
      }

      // Use Google Places Autocomplete API (this one is still fine to use)
      const service = new (window as any).google.maps.places.AutocompleteService();
      service.getPlacePredictions(
        {
          input: value,
          types: ['address']
        },
        (predictions: any[], status: any) => {
          if (status === (window as any).google.maps.places.PlacesServiceStatus.OK && predictions) {
            setLocationSuggestions(predictions);
            setShowSuggestions(true);
          } else {
            setLocationSuggestions([]);
            setShowSuggestions(false);
          }
        }
      );
    } catch (error) {
      console.error('Error fetching location suggestions:', error);
      setLocationSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleLocationSelect = async (placeId: string, description: string) => {
    setEntityLocation(description);
    setShowSuggestions(false);
    setLocationSuggestions([]);

    try {
      // Use the new Place API instead of deprecated PlacesService
      const { Place } = await (window as any).google.maps.importLibrary("places");
      
      const place = new Place({
        id: placeId,
      });

      // Fetch the place details
      await place.fetchFields({
        fields: ['displayName', 'formattedAddress', 'location']
      });

      if (place.formattedAddress && place.location) {
        setSelectedLocation({
          address: place.formattedAddress,
          lat: place.location.lat(),
          lng: place.location.lng()
        });
      }
    } catch (error) {
      console.error('Error getting place details:', error);
      // Fallback: just use the description as address
      setSelectedLocation({
        address: description,
        lat: 0,
        lng: 0
      });
    }
  };

  const handleSubmit = async () => {
    if (!entityName.trim()) {
      setErrorMessage('Entity name cannot be empty');
      return;
    }

    if (!entityType) {
      setErrorMessage('Please select an entity type');
      return;
    }

    if (mode === 'create' && !selectedLocation) {
      setErrorMessage('Please select a valid location from the suggestions');
      return;
    }

    // Parse the address from the selected location or current location
    let address: {
      street: string;
      city: string;
      state?: string;
      postal_code?: string;
      country?: string;
    };
    
    if (selectedLocation && selectedLocation.address) {
      const addressParts = selectedLocation.address.split(', ');
      address = {
        street: addressParts[0] || '',
        city: addressParts[1] || '',
        state: addressParts[2] || '',
        postal_code: addressParts[3] || '',
        country: addressParts[4] || 'USA'
      };
    } else if (mode === 'edit' && entity?.address) {
      // Keep existing address if no new location selected
      address = {
        street: entity.address.street || '',
        city: entity.address.city || '',
        state: entity.address.state,
        postal_code: entity.address.postal_code,
        country: entity.address.country
      };
    } else {
      // Default empty address for create mode
      address = {
        street: '',
        city: ''
      };
    }

    // Close modal first
    onClose();

    // Then make the API request in the background
    try {
      if (mode === 'create') {
        // Create entity
        if (!accountId) {
          onShowError?.('Account information not available');
          return;
        }

        const entityData = {
          accountId: accountId,
          name: entityName.trim(),
          entity_type: entityType as 'company' | 'subsidiary' | 'branch' | 'partnership' | 'sole_proprietorship',
          address: address
        };
        
        await profileApi.createEntity(entityData);
        
        // Refresh data and show success
        await onSuccess();
        onShowSuccess?.('Entity created successfully');
      } else {
        // Update entity
        if (!entity?._id) {
          onShowError?.('Entity information not available');
          return;
        }

        await profileApi.updateEntity(entity._id, {
          name: entityName.trim(),
          entity_type: entityType as 'company' | 'subsidiary' | 'branch' | 'partnership' | 'sole_proprietorship',
          address: address
        });
        
        // Refresh data and show success
        await onSuccess();
        onShowSuccess?.('Entity updated successfully');
      }
    } catch (error) {
      console.error(`Failed to ${mode} entity:`, error);
      const errorMsg = error instanceof Error ? error.message : `Failed to ${mode} entity`;
      onShowError?.(errorMsg);
    }
  };

  const handleClose = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setLocationSuggestions([]);
    setShowSuggestions(false);
    onClose();
  };

  const handleCloseError = () => setErrorMessage(null);

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            padding: '8px',
          }
        }}
      >
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '24px 32px',
          borderBottom: '1px solid #e5e7eb',
          position: 'sticky',
          top: 0,
          backgroundColor: '#fff',
          zIndex: 10,
        }}>
          <Typography sx={{
            fontFamily: 'Poppins, sans-serif',
            fontSize: '24px',
            fontWeight: 600,
            color: '#1f2937',
            margin: 0,
          }}>
            {mode === 'create' ? 'Create Entity' : 'Edit Entity'}
          </Typography>
          <IconButton 
            onClick={handleClose}
            sx={{
              color: '#6b7280',
              padding: '8px',
              '&:hover': {
                color: '#374151',
                backgroundColor: '#f9fafb',
              },
            }}
          >
            <Close />
          </IconButton>
        </Box>
        
        <Box sx={{ padding: '24px 32px' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Entity Name */}
            <TextField
              label="Entity Name"
              value={entityName}
              onChange={(e) => setEntityName(e.target.value)}
              fullWidth
              required
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                },
                '& .MuiInputLabel-root': {
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: '0.9rem',
                },
                '& .MuiOutlinedInput-input': {
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: '0.9rem',
                }
              }}
            />

            {/* Entity Type Dropdown */}
            <FormControl fullWidth required>
              <InputLabel sx={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.9rem' }}>
                Entity Type
              </InputLabel>
              <Select
                value={entityType}
                onChange={(e) => setEntityType(e.target.value)}
                label="Entity Type"
                sx={{
                  borderRadius: '12px',
                  '& .MuiSelect-select': {
                    fontFamily: 'Poppins, sans-serif',
                    fontSize: '0.9rem',
                  }
                }}
              >
                <MenuItem value="company" sx={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.9rem' }}>
                  Company
                </MenuItem>
                <MenuItem value="subsidiary" sx={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.9rem' }}>
                  Subsidiary
                </MenuItem>
                <MenuItem value="branch" sx={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.9rem' }}>
                  Branch
                </MenuItem>
                <MenuItem value="partnership" sx={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.9rem' }}>
                  Partnership
                </MenuItem>
                <MenuItem value="sole_proprietorship" sx={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.9rem' }}>
                  Sole Proprietorship
                </MenuItem>
              </Select>
            </FormControl>

            {/* Location Picker */}
            <Box sx={{ position: 'relative' }} ref={locationInputRef}>
              <TextField
                label="Location"
                value={entityLocation}
                onChange={(e) => handleLocationInputChange(e.target.value)}
                fullWidth
                placeholder="Enter a real address..."
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                  },
                  '& .MuiInputLabel-root': {
                    fontFamily: 'Poppins, sans-serif',
                    fontSize: '0.9rem',
                  },
                  '& .MuiOutlinedInput-input': {
                    fontFamily: 'Poppins, sans-serif',
                    fontSize: '0.9rem',
                  }
                }}
              />
              
              {/* Location Suggestions Dropdown */}
              {showSuggestions && locationSuggestions.length > 0 && (() => {
                const rect = locationInputRef.current?.getBoundingClientRect();
                return (
                  <Box
                    sx={{
                      position: 'fixed',
                      top: rect ? `${rect.bottom + 8}px` : 'auto',
                      left: rect ? `${rect.left}px` : 'auto',
                      width: rect ? `${rect.width}px` : 'auto',
                      backgroundColor: '#f8f9fa',
                      border: '1px solid #e0e0e0',
                      borderRadius: '12px',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                      zIndex: 9999,
                      maxHeight: '300px',
                      overflowY: 'auto',
                    }}
                  >
                  {locationSuggestions.map((suggestion, index) => (
                    <Box
                      key={suggestion.place_id}
                      onClick={() => handleLocationSelect(suggestion.place_id, suggestion.description)}
                      sx={{
                        padding: '14px 18px',
                        cursor: 'pointer',
                        borderBottom: index < locationSuggestions.length - 1 ? '1px solid #e8e8e8' : 'none',
                        backgroundColor: '#f8f9fa',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: '#e9ecef',
                        },
                        '&:first-of-type': {
                          borderTopLeftRadius: '12px',
                          borderTopRightRadius: '12px',
                        },
                        '&:last-of-type': {
                          borderBottomLeftRadius: '12px',
                          borderBottomRightRadius: '12px',
                        },
                        fontFamily: 'Poppins, sans-serif',
                        fontSize: '0.9rem',
                        color: '#495057',
                      }}
                    >
                      {suggestion.description}
                    </Box>
                  ))}
                  </Box>
                );
              })()}
            </Box>

            {/* Map Preview */}
            {selectedLocation && (
              <Box sx={{ height: '200px', borderRadius: '12px', overflow: 'hidden' }}>
                <iframe
                  src={`https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_GOOGLE_MAPS_PLATFORM_API}&q=${encodeURIComponent(selectedLocation.address)}&zoom=15`}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </Box>
            )}
          </Box>
        </Box>
        
        <Box sx={{
          padding: '24px 32px',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'flex-end',
          backgroundColor: '#fff',
          position: 'sticky',
          bottom: 0,
        }}>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!isFormValid()}
            size="large"
            sx={{
              backgroundColor: '#2563eb',
              color: '#fff',
              padding: '12px 32px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '14px',
              textTransform: 'none',
              minWidth: '120px',
              '&:hover': {
                backgroundColor: '#1d4ed8',
              },
              '&.Mui-disabled': {
                backgroundColor: '#9ca3af',
                color: '#fff',
              },
            }}
          >
            {mode === 'create' ? 'Create Entity' : 'Update Entity'}
          </Button>
        </Box>
      </Dialog>

      {/* Error Snackbar */}
      <Snackbar
        open={!!errorMessage}
        autoHideDuration={6000}
        onClose={handleCloseError}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseError} 
          severity="error" 
          sx={{ width: '100%' }}
        >
          {errorMessage || 'An error occurred'}
        </Alert>
      </Snackbar>

      {/* Success Snackbar */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={4000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          severity="success" 
          sx={{ width: '100%' }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default EntityModal;

