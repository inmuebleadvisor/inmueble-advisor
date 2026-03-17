import React from 'react';
import { Helmet } from 'react-helmet-async';
import PropTypes from 'prop-types';

/**
 * Componente reutilizable para inyectar Microdatos JSON-LD (Schema.org)
 * en el `<head>` del documento a través de react-helmet-async.
 * Útil para Rich Snippets en Google.
 */
const StructuredData = ({ data }) => {
    if (!data) return null;

    return (
        <Helmet>
            <script type="application/ld+json">
                {JSON.stringify(data)}
            </script>
        </Helmet>
    );
};

StructuredData.propTypes = {
    data: PropTypes.object.isRequired,
};

export default StructuredData;
